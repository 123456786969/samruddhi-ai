import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Building2,
  DollarSign,
  Calendar,
  Sparkles,
  Layers,
  BarChart3,
  Table as TableIcon,
  Copy,
  Check,
  Percent,
  Compass,
  ArrowUpRight,
  Info,
  ShieldCheck
} from 'lucide-react';

interface PropertyGrowthRoiVisualizerProps {
  initialPrice?: number;
  propertyTitle?: string;
  propertyLocation?: string;
  isCompact?: boolean;
}

interface CityBenchmark {
  name: string;
  appreciation: number;
  rentalYield: number;
  rentalEscalation: number;
  description: string;
}

const CITY_BENCHMARKS: CityBenchmark[] = [
  {
    name: 'Bengaluru (ORR / Whitefield)',
    appreciation: 10.8,
    rentalYield: 4.2,
    rentalEscalation: 6.0,
    description: 'High tech corridor demand, strong rental yield and capital appreciation.'
  },
  {
    name: 'Hyderabad (Financial Dist / Hitec)',
    appreciation: 12.0,
    rentalYield: 3.8,
    rentalEscalation: 5.5,
    description: 'Rapid infrastructure expansion with top-tier commercial office growth.'
  },
  {
    name: 'Mumbai (MMR / Western Suburbs)',
    appreciation: 7.8,
    rentalYield: 3.0,
    rentalEscalation: 5.0,
    description: 'High asset stability with steady long-term capital preservation.'
  },
  {
    name: 'Pune (Hinjewadi / Kharadi)',
    appreciation: 9.5,
    rentalYield: 4.0,
    rentalEscalation: 5.0,
    description: 'Robust IT & manufacturing ecosystem driving steady tenant occupancy.'
  },
  {
    name: 'Delhi-NCR (Golf Course Ext / Noida)',
    appreciation: 10.2,
    rentalYield: 3.4,
    rentalEscalation: 5.0,
    description: 'Premium expressway connectivity and luxury residential surge.'
  }
];

export const PropertyGrowthRoiVisualizer: React.FC<PropertyGrowthRoiVisualizerProps> = ({
  initialPrice = 12500000, // ₹1.25 Cr default
  propertyTitle,
  propertyLocation,
  isCompact = false
}) => {
  // Input parameters
  const [purchasePrice, setPurchasePrice] = useState<number>(initialPrice);
  const [years, setYears] = useState<number>(10);
  const [appreciationRate, setAppreciationRate] = useState<number>(9.5);
  const [rentalYieldRate, setRentalYieldRate] = useState<number>(3.8);
  const [rentalEscalationRate, setRentalEscalationRate] = useState<number>(5.0);
  
  // Financing
  const [isFinanced, setIsFinanced] = useState<boolean>(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(8.75);
  const [loanTenureYears, setLoanTenureYears] = useState<number>(15);

  // UI state
  const [activeChartTab, setActiveChartTab] = useState<'wealth' | 'cashflow' | 'breakdown'>('wealth');
  const [showTable, setShowTable] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('');

  // Currency Formatter
  const formatINR = (val: number, compact: boolean = false) => {
    if (val >= 10000000) {
      const cr = val / 10000000;
      return compact ? `₹${cr.toFixed(2)} Cr` : `₹${cr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
    }
    if (val >= 100000) {
      const lk = val / 100000;
      return compact ? `₹${lk.toFixed(2)} L` : `₹${lk.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakhs`;
    }
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // Quick Price Presets
  const pricePresets = [
    { label: '₹60 Lakhs', value: 6000000 },
    { label: '₹1 Crore', value: 10000000 },
    { label: '₹1.5 Crore', value: 15000000 },
    { label: '₹2.5 Crore', value: 25000000 },
    { label: '₹5 Crore', value: 50000000 },
  ];

  const handleBenchmarkSelect = (bName: string) => {
    setSelectedBenchmark(bName);
    const benchmark = CITY_BENCHMARKS.find(b => b.name === bName);
    if (benchmark) {
      setAppreciationRate(benchmark.appreciation);
      setRentalYieldRate(benchmark.rentalYield);
      setRentalEscalationRate(benchmark.rentalEscalation);
    }
  };

  // Calculation Engine
  const calculationData = useMemo(() => {
    const data: Array<{
      year: number;
      yearLabel: string;
      propertyValue: number;
      capitalGain: number;
      annualRent: number;
      cumulativeRent: number;
      totalWealth: number;
      initialCost: number;
      netProfit: number;
      roiPercent: number;
      annualAppreciation: number;
      annualEmi: number;
      cumulativeEmi: number;
    }> = [];

    // Loan calculations
    const downPayment = purchasePrice * (downPaymentPercent / 100);
    const loanPrincipal = purchasePrice - downPayment;
    const monthlyRate = (loanInterestRate / 100) / 12;
    const totalMonths = loanTenureYears * 12;
    const emiMonthly = isFinanced && loanPrincipal > 0 && monthlyRate > 0
      ? (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : 0;
    const annualEmi = emiMonthly * 12;

    let currentPropertyValue = purchasePrice;
    let initialRentYear1 = purchasePrice * (rentalYieldRate / 100);
    let currentAnnualRent = initialRentYear1;
    let cumulativeRent = 0;
    let cumulativeEmi = 0;

    // Year 0 (Starting Baseline)
    data.push({
      year: 0,
      yearLabel: 'Start (Yr 0)',
      propertyValue: Math.round(purchasePrice),
      capitalGain: 0,
      annualRent: 0,
      cumulativeRent: 0,
      totalWealth: Math.round(purchasePrice),
      initialCost: Math.round(isFinanced ? downPayment : purchasePrice),
      netProfit: 0,
      roiPercent: 0,
      annualAppreciation: 0,
      annualEmi: 0,
      cumulativeEmi: 0,
    });

    for (let yr = 1; yr <= years; yr++) {
      const prevValue = currentPropertyValue;
      currentPropertyValue = prevValue * (1 + appreciationRate / 100);
      const yearAppreciation = currentPropertyValue - prevValue;
      const capitalGain = currentPropertyValue - purchasePrice;

      // Rental growth
      if (yr > 1) {
        currentAnnualRent = currentAnnualRent * (1 + rentalEscalationRate / 100);
      }
      cumulativeRent += currentAnnualRent;

      // Loan EMI accumulation
      if (isFinanced && yr <= loanTenureYears) {
        cumulativeEmi += annualEmi;
      }

      const totalOutflow = isFinanced ? downPayment + cumulativeEmi : purchasePrice;
      const totalWealth = currentPropertyValue + cumulativeRent;
      const netProfit = totalWealth - totalOutflow;
      const roiPercent = totalOutflow > 0 ? (netProfit / totalOutflow) * 100 : 0;

      data.push({
        year: yr,
        yearLabel: `Year ${yr}`,
        propertyValue: Math.round(currentPropertyValue),
        capitalGain: Math.round(capitalGain),
        annualRent: Math.round(currentAnnualRent),
        cumulativeRent: Math.round(cumulativeRent),
        totalWealth: Math.round(totalWealth),
        initialCost: Math.round(totalOutflow),
        netProfit: Math.round(netProfit),
        roiPercent: Number(roiPercent.toFixed(1)),
        annualAppreciation: Math.round(yearAppreciation),
        annualEmi: isFinanced && yr <= loanTenureYears ? Math.round(annualEmi) : 0,
        cumulativeEmi: Math.round(cumulativeEmi),
      });
    }

    return data;
  }, [
    purchasePrice,
    years,
    appreciationRate,
    rentalYieldRate,
    rentalEscalationRate,
    isFinanced,
    downPaymentPercent,
    loanInterestRate,
    loanTenureYears
  ]);

  const latest = calculationData[calculationData.length - 1];
  const initialCost = calculationData[0].initialCost;
  const multipleTimes = (latest.totalWealth / (isFinanced ? (purchasePrice * (downPaymentPercent / 100) + latest.cumulativeEmi) : purchasePrice)).toFixed(2);
  
  // CAGR Calculation
  const totalReturnRatio = latest.totalWealth / purchasePrice;
  const cagrPercent = (Math.pow(totalReturnRatio, 1 / years) - 1) * 100;

  // Monthly rent in the final year
  const finalYearMonthlyRent = latest.annualRent / 12;

  // Copy Pitch Summary
  const handleCopySummary = () => {
    const summaryText = `📊 *Samruddhi AI - Property Investment & ROI Projection*
🏢 *Property:* ${propertyTitle || 'Premium Residential Project'} (${propertyLocation || 'Prime Location'})
💰 *Purchase Price:* ${formatINR(purchasePrice)}
⏱️ *Investment Horizon:* ${years} Years
📈 *Annual Appreciation:* ${appreciationRate}% p.a.
🔑 *Rental Yield:* ${rentalYieldRate}% (with ${rentalEscalationRate}% annual escalation)

━━━━━━━━━━━━━━━━━━━━━
🌟 *PROJECTED RETURNS AFTER ${years} YEARS:*
• *Future Property Value:* ${formatINR(latest.propertyValue)} (+${formatINR(latest.capitalGain)} Gain)
• *Cumulative Rental Income:* ${formatINR(latest.cumulativeRent)}
• *Monthly Rent in Year ${years}:* ${formatINR(finalYearMonthlyRent)}/month
• *Total Wealth Generated:* ${formatINR(latest.totalWealth)}
• *Overall ROI Multiple:* ${multipleTimes}x (${latest.roiPercent}% Return)
• *Compounded CAGR:* ${cagrPercent.toFixed(2)}% p.a.
━━━━━━━━━━━━━━━━━━━━━
_Generated via Samruddhi AI Real Estate Investment Forecaster_`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#020d09] border border-teal-800/90 rounded-xl p-4 shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[240px]">
          <div className="flex justify-between items-center border-b border-teal-900/80 pb-2">
            <span className="font-bold text-amber-400 text-sm">{dataPoint.yearLabel}</span>
            <span className="bg-teal-950 text-teal-300 font-mono px-2 py-0.5 rounded border border-teal-800">
              +{dataPoint.roiPercent}% ROI
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                Property Asset Value:
              </span>
              <span className="font-bold text-white">{formatINR(dataPoint.propertyValue)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block"></span>
                Cumulative Rental Income:
              </span>
              <span className="font-bold text-teal-300">{formatINR(dataPoint.cumulativeRent)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                Total Wealth Worth:
              </span>
              <span className="font-bold text-emerald-400">{formatINR(dataPoint.totalWealth)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-400 border-t border-teal-950 pt-1.5">
              <span>Annual Rent (Yearly):</span>
              <span className="text-gray-200">{formatINR(dataPoint.annualRent)}/yr</span>
            </div>
            
            <div className="flex justify-between items-center text-gray-400">
              <span>Net Capital Gain:</span>
              <span className="text-amber-300">+{formatINR(dataPoint.capitalGain)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="property-growth-roi-visualizer" className="bg-[#051611] border border-teal-900/60 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Banner */}
      <div className="p-6 border-b border-teal-900/60 bg-gradient-to-r from-teal-950/80 via-[#041a14] to-[#020b08] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Real Estate Investment & Growth Simulator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-400" />
            <span>Property Investment ROI Forecaster</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {propertyTitle ? (
              <span>Modeling growth projection for <strong className="text-teal-200">{propertyTitle}</strong> ({propertyLocation || 'Selected Unit'})</span>
            ) : (
              <span>Project compounded capital appreciation, rental cashflow, and wealth creation over 1 to 25 years.</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopySummary}
            className="bg-teal-950 hover:bg-teal-900 border border-teal-700/60 text-teal-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            title="Copy client-ready investment projection summary to clipboard"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedSummary ? 'Copied to Clipboard!' : 'Share ROI Pitch'}</span>
          </button>

          <button
            onClick={() => setShowTable(!showTable)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              showTable
                ? 'bg-amber-400 text-gray-950 border-amber-300'
                : 'bg-teal-950 text-gray-300 border-teal-800 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>{showTable ? 'Hide Table' : 'Yearly Table'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Controls + Visualizer */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-6 bg-black/40 p-5 rounded-xl border border-teal-900/40">
          <div className="flex items-center justify-between border-b border-teal-900/60 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Investment Parameters</span>
            </h3>
            <span className="text-[11px] text-teal-400 font-semibold">Live Real-time Model</span>
          </div>

          {/* Quick Benchmark Cities */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">
              City Benchmark Presets (Historical Growth Rate)
            </label>
            <select
              value={selectedBenchmark}
              onChange={(e) => handleBenchmarkSelect(e.target.value)}
              className="w-full bg-[#03150f] border border-teal-900/80 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-400"
            >
              <option value="">-- Select Indian Metro Benchmark --</option>
              {CITY_BENCHMARKS.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} (Apprec: {b.appreciation}%, Yield: {b.rentalYield}%)
                </option>
              ))}
            </select>
          </div>

          {/* Property Purchase Price */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-300">Property Purchase Price</label>
              <span className="text-sm font-black text-amber-400 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-800">
                {formatINR(purchasePrice)}
              </span>
            </div>
            <input
              type="range"
              min="2000000"
              max="150000000"
              step="500000"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="w-full h-2 bg-teal-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            {/* Quick Price Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {pricePresets.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPurchasePrice(p.value)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-colors ${
                    purchasePrice === p.value
                      ? 'bg-amber-400 text-gray-950 border-amber-300'
                      : 'bg-teal-950/60 text-gray-400 border-teal-900 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Horizon */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>Investment Horizon</span>
              </label>
              <span className="text-sm font-black text-teal-300 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-800">
                {years} Years
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-2 bg-teal-950 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between gap-1 text-[11px] font-semibold text-gray-400">
              {[3, 5, 10, 15, 20, 25].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setYears(yr)}
                  className={`px-2 py-0.5 rounded ${
                    years === yr ? 'bg-teal-700 text-white font-bold' : 'hover:text-white'
                  }`}
                >
                  {yr}Y
                </button>
              ))}
            </div>
          </div>

          {/* Appreciation & Rental Rates */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5 bg-teal-950/40 p-3 rounded-xl border border-teal-900/50">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-300">Annual Appreciation</span>
                <span className="text-amber-400 font-mono">{appreciationRate}%</span>
              </div>
              <input
                type="range"
                min="3"
                max="18"
                step="0.5"
                value={appreciationRate}
                onChange={(e) => setAppreciationRate(Number(e.target.value))}
                className="w-full h-1.5 bg-teal-950 rounded appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] text-gray-500 block">Capital growth p.a.</span>
            </div>

            <div className="space-y-1.5 bg-teal-950/40 p-3 rounded-xl border border-teal-900/50">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-300">Gross Rental Yield</span>
                <span className="text-teal-400 font-mono">{rentalYieldRate}%</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="8.0"
                step="0.1"
                value={rentalYieldRate}
                onChange={(e) => setRentalYieldRate(Number(e.target.value))}
                className="w-full h-1.5 bg-teal-950 rounded appearance-none cursor-pointer accent-teal-400"
              />
              <span className="text-[10px] text-gray-500 block">Initial annual rent</span>
            </div>
          </div>

          {/* Rental Escalation Rate */}
          <div className="space-y-1.5 bg-teal-950/40 p-3 rounded-xl border border-teal-900/50">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-300">Annual Rent Escalation</span>
              <span className="text-emerald-400 font-mono">{rentalEscalationRate}% / yr</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={rentalEscalationRate}
              onChange={(e) => setRentalEscalationRate(Number(e.target.value))}
              className="w-full h-1.5 bg-teal-950 rounded appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="text-[10px] text-gray-500 block">Standard rent increase every 12 months in India</span>
          </div>

          {/* Financing Toggle */}
          <div className="border border-teal-900/60 rounded-xl p-3.5 bg-[#020b08]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Include Home Loan EMI?</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFinanced}
                  onChange={(e) => setIsFinanced(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
              </label>
            </div>

            {isFinanced && (
              <div className="mt-3 pt-3 border-t border-teal-900/50 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-400 text-[10px] mb-1">Down Payment ({downPaymentPercent}%)</label>
                  <input
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full bg-black/50 border border-teal-900 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] mb-1">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={loanInterestRate}
                    onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                    className="w-full bg-black/50 border border-teal-900 rounded-lg p-1.5 text-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visualizer & Output Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/50 border border-teal-900/60 rounded-xl p-3.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Asset Value (Yr {years})
              </span>
              <p className="text-lg sm:text-xl font-black text-amber-400 truncate">
                {formatINR(latest.propertyValue, true)}
              </p>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="w-3 h-3" />
                +{formatINR(latest.capitalGain, true)} gain
              </span>
            </div>

            <div className="bg-black/50 border border-teal-900/60 rounded-xl p-3.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Cumulative Rent
              </span>
              <p className="text-lg sm:text-xl font-black text-teal-300 truncate">
                {formatINR(latest.cumulativeRent, true)}
              </p>
              <span className="text-[10px] text-gray-400 block mt-0.5 truncate">
                ~{formatINR(finalYearMonthlyRent)}/mo in Yr {years}
              </span>
            </div>

            <div className="bg-black/50 border border-teal-900/60 rounded-xl p-3.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Total Wealth
              </span>
              <p className="text-lg sm:text-xl font-black text-emerald-400 truncate">
                {formatINR(latest.totalWealth, true)}
              </p>
              <span className="text-[10px] text-teal-300 font-bold block mt-0.5">
                {multipleTimes}x Value Multiple
              </span>
            </div>

            <div className="bg-black/50 border border-teal-900/60 rounded-xl p-3.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Overall ROI & CAGR
              </span>
              <p className="text-lg sm:text-xl font-black text-white truncate">
                +{latest.roiPercent}%
              </p>
              <span className="text-[10px] text-amber-400 font-mono font-bold block mt-0.5">
                {cagrPercent.toFixed(1)}% CAGR
              </span>
            </div>
          </div>

          {/* Chart Mode Switcher */}
          <div className="flex items-center justify-between border-b border-teal-900/60 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveChartTab('wealth')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeChartTab === 'wealth'
                    ? 'bg-amber-400 text-gray-950'
                    : 'bg-teal-950 text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Wealth & Asset Growth</span>
              </button>

              <button
                onClick={() => setActiveChartTab('cashflow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeChartTab === 'cashflow'
                    ? 'bg-amber-400 text-gray-950'
                    : 'bg-teal-950 text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Annual Cashflow & Gain</span>
              </button>
            </div>

            <span className="text-[11px] text-gray-400 hidden sm:inline">
              Interactive Recharts Multi-layer Projection
            </span>
          </div>

          {/* Recharts Chart Container */}
          <div className="h-72 sm:h-80 w-full bg-black/30 rounded-xl p-3 border border-teal-900/40">
            {activeChartTab === 'wealth' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotalWealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorPropValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d9488" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#9ca3af"
                    tickFormatter={(v) => `Y${v}`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tickFormatter={(v) => {
                      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                      if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
                      return `₹${v}`;
                    }}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={purchasePrice}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Purchase Price', fill: '#f87171', fontSize: 10, position: 'insideTopRight' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalWealth"
                    name="Total Wealth Created"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotalWealth)"
                  />
                  <Area
                    type="monotone"
                    dataKey="propertyValue"
                    name="Property Asset Value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPropValue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeRent"
                    name="Cumulative Rental Income"
                    stroke="#0d9488"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#colorRent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculationData.slice(1)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d9488" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="year"
                    stroke="#9ca3af"
                    tickFormatter={(v) => `Y${v}`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    tickFormatter={(v) => {
                      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
                      if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
                      return `₹${v}`;
                    }}
                    tick={{ fontSize: 11 }}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: '8px' }}
                    formatter={(val) => <span className="text-gray-300">{val}</span>}
                  />
                  <Bar dataKey="annualAppreciation" name="YoY Capital Gain" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="annualRent" name="Annual Rent Earned" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Insights Banner */}
          <div className="bg-teal-950/40 border border-teal-800/50 rounded-xl p-4 flex items-start gap-3 text-xs text-teal-100">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">
                Strategic Investor Insight:
              </p>
              <p className="text-gray-300">
                At <strong className="text-amber-400">{appreciationRate}% p.a.</strong> growth and <strong className="text-teal-300">{rentalYieldRate}%</strong> yield, your property doubles in value every <strong className="text-white">~{Math.round(72 / appreciationRate)} years</strong> (Rule of 72), while rental income provides continuous inflation-hedged dividend cashflow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Year-by-Year Growth Table */}
      {showTable && (
        <div className="p-6 border-t border-teal-900/60 bg-[#020b08] overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-amber-400" />
              <span>Complete Year-by-Year Growth & Cashflow Breakdown</span>
            </h3>
            <span className="text-xs text-gray-400">All amounts in Indian Rupees (INR)</span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-teal-900 text-gray-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Timeline</th>
                <th className="py-2.5 px-3">Property Value</th>
                <th className="py-2.5 px-3">YoY Capital Gain</th>
                <th className="py-2.5 px-3">Annual Rent</th>
                <th className="py-2.5 px-3">Cumulative Rent</th>
                <th className="py-2.5 px-3">Total Wealth</th>
                <th className="py-2.5 px-3">Net Profit</th>
                <th className="py-2.5 px-3">Total ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-950 text-gray-300">
              {calculationData.map((row) => (
                <tr key={row.year} className="hover:bg-teal-950/30 transition-colors font-mono">
                  <td className="py-2.5 px-3 font-sans font-bold text-white">{row.yearLabel}</td>
                  <td className="py-2.5 px-3 font-bold text-amber-400">{formatINR(row.propertyValue)}</td>
                  <td className="py-2.5 px-3 text-emerald-400">+{formatINR(row.annualAppreciation)}</td>
                  <td className="py-2.5 px-3 text-teal-300">{row.year === 0 ? '-' : `${formatINR(row.annualRent)}/yr`}</td>
                  <td className="py-2.5 px-3 text-teal-400">{formatINR(row.cumulativeRent)}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">{formatINR(row.totalWealth)}</td>
                  <td className="py-2.5 px-3 text-emerald-300">+{formatINR(row.netProfit)}</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-teal-950 px-2 py-0.5 rounded text-amber-400 font-bold border border-teal-800">
                      +{row.roiPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
