const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/DashboardLeads.tsx', 'utf8');
content = content.replace('import React from "react";\nimport { safeFormatDate } from "../../utils";\n, { useState, useEffect } from \'react\';', 'import React, { useState, useEffect } from \'react\';\nimport { safeFormatDate } from "../../utils";');
fs.writeFileSync('src/components/dashboard/DashboardLeads.tsx', content);
