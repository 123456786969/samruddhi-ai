import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  QueryConstraint,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useToast } from '../components/dashboard/ui/Toast';
import { getInitialDemoData } from '../data/demoSeed';

interface Identifiable {
  id: string;
  agent_id: string;
  [key: string]: any;
}

interface UseAgentCollectionOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  customQueryConstraints?: QueryConstraint[];
  skip?: boolean;
}

export function useAgentCollection<T extends Identifiable>(
  collectionName: string,
  options?: UseAgentCollectionOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Keep a ref of current data for rollbacks and undo
  const dataRef = useRef<T[]>([]);
  dataRef.current = data;

  // Pending delete timers map: id -> { timerId, item }
  const pendingDeletes = useRef<Map<string, { timer: ReturnType<typeof setTimeout>; item: T }>>(
    new Map()
  );

  let toast: ReturnType<typeof useToast> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toast = useToast();
  } catch (e) {
    // Graceful fallback if invoked outside ToastProvider
  }

  const [authUid, setAuthUid] = useState<string | null>(() => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    const storedDemo = localStorage.getItem('demoUser') || sessionStorage.getItem('demoUser');
    if (storedDemo) {
      try {
        return JSON.parse(storedDemo).uid || 'usr_demo_partner_blr';
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u?.uid) {
        setAuthUid(u.uid);
      } else {
        const storedDemo = localStorage.getItem('demoUser') || sessionStorage.getItem('demoUser');
        const otpVerified = localStorage.getItem('otpVerified') === 'true' || sessionStorage.getItem('otpVerified') === 'true';
        if (storedDemo && otpVerified) {
          try {
            setAuthUid(JSON.parse(storedDemo).uid || 'usr_demo_partner_blr');
          } catch {
            setAuthUid(null);
          }
        } else {
          setAuthUid(null);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const uid = authUid;

  useEffect(() => {
    if (!uid || options?.skip) {
      setData([]);
      setLoading(false);
      return;
    }

    // If running in demo mode or without Firebase Auth popup
    if (!auth.currentUser) {
      try {
        const demoKey = `demo_${collectionName}`;
        const raw = localStorage.getItem(demoKey);
        let items: T[] = raw ? JSON.parse(raw) : [];
        if (!items || items.length === 0) {
          items = getInitialDemoData(collectionName, uid) as T[];
          localStorage.setItem(demoKey, JSON.stringify(items));
        }
        setData(items);
      } catch (e) {
        console.warn(`Demo collection fallback read notice (${collectionName}):`, e);
        setData([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const constraints: QueryConstraint[] = [where('agent_id', '==', uid)];

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    }

    if (options?.customQueryConstraints) {
      constraints.push(...options.customQueryConstraints);
    }

    const q = query(collection(db, collectionName), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as T),
          id: docSnap.id,
        }));
        // Filter out any item currently in pending optimistic delete
        const filtered = items.filter((item) => !pendingDeletes.current.has(item.id));
        setData(filtered);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn(`Firestore snapshot notice (${collectionName}):`, err.message);
        // Fallback to local demo data if permission denied in preview
        try {
          const demoKey = `demo_${collectionName}`;
          const raw = localStorage.getItem(demoKey);
          let items: T[] = raw ? JSON.parse(raw) : [];
          if (!items || items.length === 0) {
            items = getInitialDemoData(collectionName, uid) as T[];
            localStorage.setItem(demoKey, JSON.stringify(items));
          }
          setData(items);
        } catch {
          setError(err);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [collectionName, uid, options?.orderByField, options?.orderDirection, options?.skip]);

  // Optimistic Add
  const addItem = useCallback(
    async (itemData: Omit<T, 'id' | 'agent_id'> & Partial<{ agent_id: string }>): Promise<string> => {
      if (!uid) throw new Error('Not authenticated');

      const tempId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const optimisticItem = {
        ...itemData,
        id: tempId,
        agent_id: uid,
        created_at: (itemData as any).created_at || Date.now(),
      } as unknown as T;

      // Optimistic update
      setData((prev) => [optimisticItem, ...prev]);

      if (!auth.currentUser) {
        try {
          const demoKey = `demo_${collectionName}`;
          const raw = localStorage.getItem(demoKey);
          const items: any[] = raw ? JSON.parse(raw) : [];
          localStorage.setItem(demoKey, JSON.stringify([optimisticItem, ...items]));
          toast?.success('Item created successfully');
        } catch {}
        return tempId;
      }

      try {
        const cleanPayload = {
          ...itemData,
          agent_id: uid,
          created_at: (itemData as any).created_at || Date.now(),
        };
        const docRef = await addDoc(collection(db, collectionName), cleanPayload);
        // Replace temp item with real id
        setData((prev) =>
          prev.map((item) => (item.id === tempId ? { ...optimisticItem, id: docRef.id } : item))
        );
        return docRef.id;
      } catch (err: any) {
        // Rollback
        setData((prev) => prev.filter((item) => item.id !== tempId));
        toast?.error('Failed to create item', err?.message || 'Check your permissions');
        throw err;
      }
    },
    [uid, collectionName, toast]
  );

  // Optimistic Update
  const updateItem = useCallback(
    async (id: string, updates: Partial<T>): Promise<void> => {
      if (!uid) throw new Error('Not authenticated');

      const previousItem = dataRef.current.find((item) => item.id === id);
      if (!previousItem) return;

      // Optimistically apply updates
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );

      if (!auth.currentUser) {
        try {
          const demoKey = `demo_${collectionName}`;
          const raw = localStorage.getItem(demoKey);
          const items: any[] = raw ? JSON.parse(raw) : [];
          const updated = items.map((it: any) => it.id === id ? { ...it, ...updates } : it);
          localStorage.setItem(demoKey, JSON.stringify(updated));
        } catch {}
        return;
      }

      try {
        const cleanUpdates = { ...updates };
        delete (cleanUpdates as any).id;
        delete (cleanUpdates as any).agent_id;

        await updateDoc(doc(db, collectionName, id), cleanUpdates as { [x: string]: any });
      } catch (err: any) {
        // Rollback
        setData((prev) =>
          prev.map((item) => (item.id === id ? previousItem : item))
        );
        toast?.error('Failed to update item', err?.message || 'Check your permissions');
        throw err;
      }
    },
    [uid, collectionName, toast]
  );

  // Optimistic Delete with 5-second Undo
  const deleteItem = useCallback(
    (id: string, options?: { undoable?: boolean; label?: string }): Promise<void> => {
      if (!uid) return Promise.reject(new Error('Not authenticated'));

      const itemToDelete = dataRef.current.find((item) => item.id === id);
      if (!itemToDelete) return Promise.resolve();

      const undoable = options?.undoable !== false;
      const label = options?.label || 'Item';

      // Instantly remove from UI
      setData((prev) => prev.filter((item) => item.id !== id));

      if (!auth.currentUser) {
        try {
          const demoKey = `demo_${collectionName}`;
          const raw = localStorage.getItem(demoKey);
          const items: any[] = raw ? JSON.parse(raw) : [];
          const updated = items.filter((it: any) => it.id !== id);
          localStorage.setItem(demoKey, JSON.stringify(updated));
        } catch {}
        toast?.success(`${label} deleted`);
        return Promise.resolve();
      }

      if (!undoable) {
        // Hard delete immediately
        return deleteDoc(doc(db, collectionName, id)).catch((err) => {
          setData((prev) => [...prev, itemToDelete]);
          toast?.error(`Failed to delete ${label}`, err?.message);
          throw err;
        });
      }

      // Schedule delete with 5-second undo window
      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(async () => {
          pendingDeletes.current.delete(id);
          try {
            await deleteDoc(doc(db, collectionName, id));
            resolve();
          } catch (err: any) {
            // Restore item on failure
            setData((prev) => [...prev, itemToDelete]);
            toast?.error(`Failed to delete ${label}`, err?.message);
            reject(err);
          }
        }, 5000);

        pendingDeletes.current.set(id, { timer, item: itemToDelete });

        // Show toast with Undo action
        toast?.toast({
          type: 'info',
          title: `${label} deleted`,
          message: 'Action can be undone within 5 seconds',
          duration: 5000,
          undoLabel: 'Undo',
          undoAction: () => {
            // User clicked Undo
            const pending = pendingDeletes.current.get(id);
            if (pending) {
              clearTimeout(pending.timer);
              pendingDeletes.current.delete(id);
              // Restore item
              setData((prev) => [...prev, itemToDelete]);
              toast?.success(`${label} restored`);
            }
          },
        });
      });
    },
    [uid, collectionName, toast]
  );

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
  };
}
