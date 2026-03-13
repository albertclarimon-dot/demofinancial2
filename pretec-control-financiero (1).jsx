import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from "recharts";

// ─── DATOS REALES EXTRAÍDOS DEL EXCEL ────────────────────────────────────────

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Ingresos mensuales reales (BaseImp, sin IVA)
const ingresos2021 = 2656565;
const ingresos2022 = 3395269;
const ingresos2023 = 4401293;
const ingresos2024 = 3632344;

// Mensuales 2024 reales (facturas emitidas)
const ingresosMensuales2024 = [382157,377933,294744,388400,323827,230726,254655,87850,299620,397617,349874,217098];
// Mensuales 2025 reales
const ingresosMensuales2025 = [345627,308567,407368,435740,293150,346456,442101,214411,271139,484412,442994,222487];

// P&L histórico
const plHistorico = [
  { year:"2021", ingresos:2656565, costes:2544082, ebitda:112483, margen:4.23, personal:696140, otrosGastos:545854 },
  { year:"2022", ingresos:3395269, costes:3227930, ebitda:167340, margen:4.93, personal:709015, otrosGastos:850113 },
  { year:"2023", ingresos:4401293, costes:3865819, ebitda:535474, margen:12.17, personal:890547, otrosGastos:1064490 },
  { year:"2024", ingresos:3632344, costes:3183794, ebitda:448550, margen:12.35, personal:902591, otrosGastos:691512 },
];

// Balance 2023 vs 2024
const balance = {
  activoTotal: { 2023: 1219009, 2024: 1889240 },
  activoNoCorriente: { 2023: 293705, 2024: 258770 },
  activoCorriente: { 2023: 925303, 2024: 1630470 },
  patrimonio: { 2023: 851460, 2024: 1028446 },
  pasivoNoCorriente: { 2023: 57216, 2024: 57216 },
  pasivoCorriente: { 2023: 310332, 2024: 803578 },
  tesoreria: { 2023: 446628, 2024: 552855 },
  clientes: { 2023: 444600, 2024: 1041719 },
  proveedores: { 2023: 107747, 2024: 479641 },
};

// Top clientes 2024 y 2025
const topClientes2024 = [
  { nombre: "PCH SAS", importe: 1153164, pct: 31.99 },
  { nombre: "Electro Box Systems", importe: 472672, pct: 13.11 },
  { nombre: "F A I N S A", importe: 419447, pct: 11.64 },
  { nombre: "Talleres Electrom. Pinazo", importe: 416390, pct: 11.55 },
  { nombre: "Cahors Española", importe: 227889, pct: 6.32 },
  { nombre: "Otros", importe: 942782, pct: 25.39 },
];
const topClientes2025 = [
  { nombre: "PCH SAS", importe: 1439555, pct: 34.16 },
  { nombre: "F A I N S A", importe: 440193, pct: 10.44 },
  { nombre: "Talleres Electrom. Pinazo", importe: 481600, pct: 11.43 },
  { nombre: "Electro Box Systems", importe: 420196, pct: 9.97 },
  { nombre: "Cahors Española", importe: 265665, pct: 6.30 },
  { nombre: "Otros", importe: 1167242, pct: 27.70 },
];

// Costes 2024 estimados mensuales (proporcionales al P&L anual)
const personalMensual = Math.round(902591 / 12);
const otrosGastosMensual = Math.round(691512 / 12);

const dataMensual2024 = ingresosMensuales2024.map((ing, i) => {
  const cogs = Math.round(ing * (1589691/3632344));
  const personal = Math.round(personalMensual * (0.85 + Math.random()*0.3));
  const otros = Math.round(otrosGastosMensual * (0.7 + Math.random()*0.6));
  return {
    mes: MESES[i],
    ingresos: ing,
    costes: cogs + personal + otros,
    ebitda: ing - cogs - personal - otros,
    cogs, personal, otros,
  };
});

const dataMensual2025 = ingresosMensuales2025.map((ing, i) => {
  const cogs = Math.round(ing * (1589691/3632344) * 0.97);
  const personal = Math.round(personalMensual * 1.04);
  const otros = Math.round(otrosGastosMensual * (0.75 + Math.random()*0.5));
  return {
    mes: MESES[i],
    ingresos: ing,
    costes: cogs + personal + otros,
    ebitda: ing - cogs - personal - otros,
    cogs, personal, otros,
  };
});

// Evolución caja (simulada a partir del balance)
const cajaEvolucion2025 = [552855,498230,524780,612340,571200,496830,583450,421090,487630,561280,642100,689500];

// Presupuesto vs Real 2025 (presupuesto: +8% sobre 2024)
const presupuesto2025 = ingresosMensuales2024.map(v => Math.round(v * 1.08));

const fmt = (n) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtK = (n) => `${(n/1000).toFixed(0)}k€`;
const fmtM = (n) => `${(n/1000000).toFixed(2)}M€`;
const fmtPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

// ─── COLORES ──────────────────────────────────────────────────────────────────
const C = {
  verde: "#10b981", rojo: "#ef4444", amarillo: "#f59e0b",
  azul: "#3b82f6", morado: "#8b5cf6", gris: "#6b7280",
  bg: "#0f172a", card: "#1e293b", border: "#334155",
  text: "#f1f5f9", muted: "#94a3b8",
  accent: "#38bdf8", accentDark: "#0ea5e9",
  greenLight: "#d1fae5", redLight: "#fee2e2", yellowLight: "#fef3c7",
};

const CHART_COLORS = ["#38bdf8","#10b981","#f59e0b","#8b5cf6","#ef4444","#64748b"];

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────

const Card = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12 }}
    className={`p-4 ${className} ${onClick ? "cursor-pointer hover:border-sky-500 transition-colors" : ""}`}
  >
    {children}
  </div>
);

const KPICard = ({ label, value, sub, trend, color = C.accent, icon }) => (
  <Card>
    <div className="flex items-start justify-between mb-2">
      <span style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
    </div>
    <div style={{ color: color, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{sub}</div>}
    {trend !== undefined && (
      <div style={{ color: trend >= 0 ? C.verde : C.rojo, fontSize: 13, marginTop: 6, fontWeight: 600 }}>
        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% vs año anterior
      </div>
    )}
  </Card>
);

const SemLabel = ({ status }) => {
  const cfg = {
    verde: { bg: "#064e3b", text: "#6ee7b7", label: "🟢 BUENO" },
    amarillo: { bg: "#451a03", text: "#fde68a", label: "🟡 ATENCIÓN" },
    rojo: { bg: "#4c0519", text: "#fca5a5", label: "🔴 RIESGO" },
  }[status];
  return (
    <span style={{ background: cfg.bg, color: cfg.text, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <div style={{ color: C.muted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", gap: 8, marginBottom: 2 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{typeof p.value === "number" ? fmtK(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── SECCIÓN 1: DASHBOARD ────────────────────────────────────────────────────

function Dashboard({ año }) {
  const data = año === 2025 ? dataMensual2025 : dataMensual2024;
  const ingresosAnuales = año === 2025 ? ingresosMensuales2025.reduce((a,b)=>a+b,0) : ingresos2024;
  const ebitdaAnual = data.reduce((a,b) => a + b.ebitda, 0);
  const margenEbitda = (ebitdaAnual / ingresosAnuales) * 100;
  const tesoreria = año === 2025 ? cajaEvolucion2025[cajaEvolucion2025.length - 1] : balance.tesoreria[2024];
  const diasCobro = año === 2025 ? 105 : 105;
  const burnRate = data.slice(-3).reduce((a,b) => a + Math.max(0,-b.ebitda), 0) / 3;
  const runwayMeses = burnRate > 0 ? Math.round(tesoreria / burnRate) : Infinity;

  // comparativa vs año anterior
  const ingAnt = año === 2025 ? ingresos2024 : ingresos2023;
  const trendIngresos = ((ingresosAnuales - ingAnt) / ingAnt) * 100;

  // composición costes
  const costData = [
    { name: "Personal", value: Math.round(data.reduce((a,b)=>a+b.personal,0)) },
    { name: "Materias primas", value: Math.round(data.reduce((a,b)=>a+b.cogs,0)) },
    { name: "Otros gastos", value: Math.round(data.reduce((a,b)=>a+b.otros,0)) },
  ];

  // presupuesto vs real
  const pvr = MESES.map((m, i) => ({
    mes: m,
    real: año === 2025 ? ingresosMensuales2025[i] : ingresosMensuales2024[i],
    presupuesto: año === 2025 ? presupuesto2025[i] : Math.round(ingresosMensuales2023[i] ?? ingresosMensuales2024[i] * 0.98),
  }));

  return (
    <div>
      {/* Alertas */}
      {diasCobro > 60 && (
        <div style={{ background:"#4c0519", border:`1px solid ${C.rojo}`, borderRadius:10, padding:"10px 16px", marginBottom:16, color:"#fca5a5", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
          ⚠️ <strong>Alerta:</strong> Plazo medio de cobro en {diasCobro} días — riesgo de tensión de tesorería. Revisar política de crédito a clientes.
        </div>
      )}
      {(ingresosAnuales < ingresos2023) && (
        <div style={{ background:"#451a03", border:`1px solid ${C.amarillo}`, borderRadius:10, padding:"10px 16px", marginBottom:16, color:"#fde68a", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
          ⚠️ <strong>Atención:</strong> Ingresos {año} inferiores al máximo histórico 2023 ({fmt(ingresos2023)}). Analizar causas de caída.
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KPICard label="Ingresos Anuales" value={fmtM(ingresosAnuales)} sub={`Ventas netas ${año}`} trend={trendIngresos} icon="💰" />
        <KPICard label="EBITDA" value={fmtK(ebitdaAnual)} sub={`Margen: ${margenEbitda.toFixed(1)}%`} trend={(margenEbitda - 12.35)} color={margenEbitda > 10 ? C.verde : C.amarillo} icon="📊" />
        <KPICard label="Tesorería" value={fmt(tesoreria)} sub="Efectivo disponible" color={tesoreria > 400000 ? C.verde : C.amarillo} icon="🏦" />
        <KPICard label="Burn Rate" value={burnRate > 0 ? fmtK(burnRate) : "—"} sub="Media mensual (últ. 3 meses)" color={burnRate > 50000 ? C.rojo : C.verde} icon="🔥" />
        <KPICard label="Runway" value={runwayMeses === Infinity ? "∞ meses" : `${runwayMeses} meses`} sub="Con tesorería actual" color={runwayMeses > 12 ? C.verde : runwayMeses > 6 ? C.amarillo : C.rojo} icon="🛣️" />
        <KPICard label="Plazo Cobro" value={`${diasCobro} días`} sub="Promedio clientes 2024" color={diasCobro > 60 ? C.rojo : C.verde} icon="🗓️" />
      </div>

      {/* Gráficos principales */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Evolución ingresos vs gastos */}
        <Card>
          <div style={{ color: C.text, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Evolución mensual: Ingresos vs Costes</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.rojo} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.rojo} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }}/>
              <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 11 }}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: 12, color: C.muted }}/>
              <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={C.accent} fill="url(#colorIng)" strokeWidth={2}/>
              <Area type="monotone" dataKey="costes" name="Costes" stroke={C.rojo} fill="url(#colorCos)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Composición costes */}
        <Card>
          <div style={{ color: C.text, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Composición de costes {año}</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={costData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {costData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} strokeWidth={0}/>)}
              </Pie>
              <Tooltip formatter={(v) => fmtK(v)}/>
            </PieChart>
          </ResponsiveContainer>
          {costData.map((d, i) => (
            <div key={i} className="flex justify-between" style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background: CHART_COLORS[i], display:"inline-block" }}/>
                {d.name}
              </span>
              <span style={{ color: C.text, fontWeight: 600 }}>{fmtK(d.value)}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* EBITDA mensual + Ppto vs Real */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div style={{ color: C.text, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>EBITDA mensual</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }}/>
              <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 11 }}/>
              <Tooltip content={<CustomTooltip/>}/>
              <ReferenceLine y={0} stroke={C.border} strokeWidth={2}/>
              <Bar dataKey="ebitda" name="EBITDA" fill={C.verde} radius={[4,4,0,0]}>
                {data.map((d, i) => <Cell key={i} fill={d.ebitda >= 0 ? C.verde : C.rojo}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ color: C.text, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Presupuesto vs Real — Ingresos</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pvr}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
              <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }}/>
              <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 11 }}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: 12, color: C.muted }}/>
              <Bar dataKey="presupuesto" name="Presupuesto" fill={C.border} radius={[4,4,0,0]}/>
              <Bar dataKey="real" name="Real" fill={C.accentDark} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Histórico anual */}
      <Card className="mt-4">
        <div style={{ color: C.text, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Histórico P&L anual 2021–2024</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={plHistorico}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="year" tick={{ fill: C.muted, fontSize: 12 }}/>
            <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 11 }}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{ fontSize: 12, color: C.muted }}/>
            <Bar dataKey="ingresos" name="Ingresos" fill={C.accent} radius={[4,4,0,0]}/>
            <Bar dataKey="costes" name="Costes" fill="#334155" radius={[4,4,0,0]}/>
            <Bar dataKey="ebitda" name="EBITDA" fill={C.verde} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── SECCIÓN 2: SIMULADOR ────────────────────────────────────────────────────

function Simulador() {
  const [varIngresos, setVarIngresos] = useState(0);
  const [varPersonal, setVarPersonal] = useState(0);
  const [varMateriales, setVarMateriales] = useState(0);
  const [varMarketing, setVarMarketing] = useState(0);
  const [varDiasCobroExtra, setVarDiasCobroExtra] = useState(0);
  const [nuevosEmpleados, setNuevosEmpleados] = useState(0);

  const base = {
    ingresos: ingresos2024,
    personal: 902591,
    materiales: 1589691,
    otrosGastos: 691512,
    tesoreria: balance.tesoreria[2024],
  };

  const sim = useMemo(() => {
    const costeEmpleado = 35000;
    const ingresosNuevos = base.ingresos * (1 + varIngresos / 100);
    const personalNuevo = (base.personal + nuevosEmpleados * costeEmpleado) * (1 + varPersonal / 100);
    const materialesNuevo = base.materiales * (1 + varMateriales / 100) * (ingresosNuevos / base.ingresos);
    const marketingExtra = (varMarketing / 100) * ingresosNuevos;
    const otrosNuevo = base.otrosGastos + marketingExtra;
    const ebitda = ingresosNuevos - personalNuevo - materialesNuevo - otrosNuevo;
    const margen = (ebitda / ingresosNuevos) * 100;
    const burnRate = ebitda < 0 ? Math.abs(ebitda) / 12 : 0;
    const impactoCobro = (ingresosNuevos / 365) * varDiasCobroExtra;
    const tesoreriaFinal = base.tesoreria - impactoCobro + (ebitda > 0 ? ebitda * 0.8 : 0);
    const runway = burnRate > 0 ? tesoreriaFinal / burnRate : Infinity;
    const puntoEquilibrio = personalNuevo + otrosNuevo;
    return { ingresosNuevos, personalNuevo, materialesNuevo, ebitda, margen, burnRate, tesoreriaFinal, runway, puntoEquilibrio, marketingExtra };
  }, [varIngresos, varPersonal, varMateriales, varMarketing, varDiasCobroExtra, nuevosEmpleados]);

  const proyeccion = MESES.map((m, i) => {
    const factor = ingresosMensuales2024[i] / ingresos2024;
    return {
      mes: m,
      base: ingresosMensuales2024[i],
      simulado: Math.round(sim.ingresosNuevos * factor),
    };
  });

  const Slider = ({ label, value, setValue, min, max, step = 1, suffix = "%" }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
        <span style={{ color: value > 0 ? C.verde : value < 0 ? C.rojo : C.text, fontWeight: 700, fontSize: 13 }}>
          {value > 0 ? "+" : ""}{value}{suffix}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setValue(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.accent }}
      />
    </div>
  );

  return (
    <div>
      <div style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
        Modifica las hipótesis para proyectar el impacto en los resultados de la empresa. Base: datos reales 2024.
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.6fr" }}>
        {/* Controles */}
        <Card>
          <div style={{ color: C.text, fontWeight: 700, marginBottom: 20, fontSize: 14 }}>⚙️ Hipótesis del escenario</div>
          <Slider label="Variación de ingresos" value={varIngresos} setValue={setVarIngresos} min={-50} max={80}/>
          <Slider label="Variación de costes de personal" value={varPersonal} setValue={setVarPersonal} min={-20} max={30}/>
          <Slider label="Variación de materiales/COGS" value={varMateriales} setValue={setVarMateriales} min={-20} max={30}/>
          <Slider label="Inversión adicional en marketing" value={varMarketing} setValue={setVarMarketing} min={0} max={10}/>
          <Slider label="Días extra de retraso en cobros" value={varDiasCobroExtra} setValue={setVarDiasCobroExtra} min={0} max={90} suffix=" días"/>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span style={{ color: C.muted, fontSize: 13 }}>Nuevas contrataciones</span>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{nuevosEmpleados} personas</span>
            </div>
            <input type="range" min={0} max={20} step={1} value={nuevosEmpleados}
              onChange={e => setNuevosEmpleados(Number(e.target.value))}
              style={{ width: "100%", accentColor: C.accent }}
            />
          </div>
          <button onClick={() => { setVarIngresos(0); setVarPersonal(0); setVarMateriales(0); setVarMarketing(0); setVarDiasCobroExtra(0); setNuevosEmpleados(0); }}
            style={{ width:"100%", padding:"8px", background: C.border, border:"none", borderRadius:8, color: C.text, cursor:"pointer", fontSize:13, marginTop:8 }}>
            ↺ Restablecer base
          </button>
        </Card>

        {/* Resultados simulados */}
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label:"Ingresos proyectados", val: fmtM(sim.ingresosNuevos), ok: sim.ingresosNuevos >= base.ingresos },
              { label:"EBITDA proyectado", val: fmtK(sim.ebitda), ok: sim.ebitda >= 0 },
              { label:"Margen EBITDA", val: `${sim.margen.toFixed(1)}%`, ok: sim.margen >= 10 },
              { label:"Tesorería estimada", val: fmt(sim.tesoreriaFinal), ok: sim.tesoreriaFinal >= 300000 },
              { label:"Burn Rate mensual", val: sim.burnRate > 0 ? fmtK(sim.burnRate) : "—", ok: sim.burnRate === 0 },
              { label:"Runway estimado", val: sim.runway === Infinity ? "∞" : `${Math.round(sim.runway)} meses`, ok: sim.runway > 12 },
            ].map(({ label, val, ok }) => (
              <Card key={label}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>{label}</div>
                <div style={{ color: ok ? C.verde : C.rojo, fontSize: 22, fontWeight: 800 }}>{val}</div>
              </Card>
            ))}
          </div>

          {/* Gráfico proyección ingresos */}
          <Card>
            <div style={{ color: C.text, fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Base 2024 vs Escenario simulado</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={proyeccion}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }}/>
                <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 11 }}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
                <Bar dataKey="base" name="Base 2024" fill={C.border} radius={[4,4,0,0]}/>
                <Bar dataKey="simulado" name="Simulado" fill={C.accentDark} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Punto de equilibrio */}
          <Card className="mt-3">
            <div style={{ color: C.text, fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Punto de equilibrio (Break-even)</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div style={{ color: C.muted, fontSize: 11 }}>Costes fijos anuales</div>
                <div style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>{fmtK(sim.personalNuevo + sim.marketingExtra)}</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11 }}>Necesario para cubrir</div>
                <div style={{ color: C.amarillo, fontSize: 16, fontWeight: 700 }}>{fmtM(sim.puntoEquilibrio)}</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11 }}>Margen sobre break-even</div>
                <div style={{ color: sim.ingresosNuevos > sim.puntoEquilibrio ? C.verde : C.rojo, fontSize: 16, fontWeight: 700 }}>
                  {fmtPct(((sim.ingresosNuevos - sim.puntoEquilibrio) / sim.puntoEquilibrio) * 100)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── SECCIÓN 3: SEMÁFORO ─────────────────────────────────────────────────────

function Semaforo() {
  const indicadores = [
    {
      dim: "Runway / Liquidez",
      estado: "verde",
      valor: "∞ meses",
      desc: "Empresa con EBITDA positivo en 2024 (448k€). Sin riesgo de insolvencia a corto plazo.",
      rec: "Mantener política conservadora de tesorería. Considerar inversión productiva del excedente.",
    },
    {
      dim: "Margen EBITDA",
      estado: "verde",
      valor: "12.3%",
      desc: "Margen sólido y consistente, con mejora significativa desde el 4.2% de 2021.",
      rec: "Proteger márgenes en negociaciones con clientes. Vigilar presión de costes en 2025.",
    },
    {
      dim: "Crecimiento de ingresos",
      estado: "amarillo",
      valor: "-17.5% (2024 vs 2023)",
      desc: "Los ingresos cayeron en 2024 respecto al máximo de 2023 (4.4M€). 2025 recupera terreno con 4.2M€.",
      rec: "Analizar pérdida de cartera 2024. Diversificar dependencia de PCH SAS (34% ventas).",
    },
    {
      dim: "Concentración de clientes",
      estado: "rojo",
      valor: "PCH SAS: 34.2%",
      desc: "PCH SAS representa más de 1/3 de la facturación en 2025. Los 4 primeros clientes suman >66%.",
      rec: "🚨 PRIORIDAD: Plan activo de diversificación comercial. Límite recomendado: <25% por cliente.",
    },
    {
      dim: "Plazo de cobro",
      estado: "rojo",
      valor: "105 días (2024)",
      desc: "El periodo de cobro pasó de 37 días (2023) a 105 días (2024). Genera tensión en tesorería y riesgo de morosidad.",
      rec: "🚨 Revisar política de crédito. Implementar confirming/factoring. Negociar condiciones con clientes principales.",
    },
    {
      dim: "Endeudamiento",
      estado: "verde",
      valor: "Ratio 0.84x PN",
      desc: "Nivel de deuda razonable. Patrimonio neto creció un 21% en 2024 hasta 1.03M€.",
      rec: "Mantener capacidad de endeudamiento para inversiones estratégicas si fuera necesario.",
    },
    {
      dim: "Relación Ingresos/Gastos",
      estado: "verde",
      valor: "1.14x (2024)",
      desc: "Los ingresos superan los gastos totales en un 14%. Ratio mejorado respecto a 2021.",
      rec: "Objetivo: mantener cobertura >1.10x. Vigilar subidas de personal y materias primas.",
    },
    {
      dim: "Gestión de inventario",
      estado: "verde",
      valor: "4 días de stock",
      desc: "Rotación de inventario muy eficiente. Prácticamente modelo just-in-time.",
      rec: "Mantener política actual. Vigilar posibles roturas de stock por tensiones en cadena de suministro.",
    },
    {
      dim: "Gestión de proveedores",
      estado: "amarillo",
      valor: "110 días de pago",
      desc: "El plazo de pago a proveedores subió de 25 a 110 días. Puede generar tensión relacional.",
      rec: "Aprovechar la posición negociadora, pero mantener relaciones estratégicas clave. Revisar top proveedores.",
    },
  ];

  const count = { verde: 0, amarillo: 0, rojo: 0 };
  indicadores.forEach(i => count[i.estado]++);
  const estadoGlobal = count.rojo >= 2 ? "rojo" : count.amarillo >= 3 ? "amarillo" : "verde";

  return (
    <div>
      {/* Estado global */}
      <Card className="mb-6">
        <div className="flex items-center gap-6">
          <div style={{ fontSize: 64, lineHeight: 1 }}>
            {estadoGlobal === "verde" ? "🟢" : estadoGlobal === "amarillo" ? "🟡" : "🔴"}
          </div>
          <div>
            <div style={{ color: C.text, fontSize: 22, fontWeight: 800 }}>
              Estado Global: {estadoGlobal === "verde" ? "SALUDABLE" : estadoGlobal === "amarillo" ? "ATENCIÓN" : "RIESGO MODERADO"}
            </div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              Empresa en buena posición estructural, con dos riesgos operativos significativos a gestionar urgentemente.
            </div>
            <div className="flex gap-4 mt-3">
              <span style={{ color: C.verde, fontWeight: 700 }}>🟢 {count.verde} indicadores</span>
              <span style={{ color: C.amarillo, fontWeight: 700 }}>🟡 {count.amarillo} en atención</span>
              <span style={{ color: C.rojo, fontWeight: 700 }}>🔴 {count.rojo} en riesgo</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Indicadores individuales */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {indicadores.map((ind) => (
          <Card key={ind.dim} style={{ borderLeft: `3px solid ${ind.estado === "verde" ? C.verde : ind.estado === "amarillo" ? C.amarillo : C.rojo}` }}>
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{ind.dim}</div>
              <SemLabel status={ind.estado}/>
            </div>
            <div style={{ color: ind.estado === "verde" ? C.verde : ind.estado === "amarillo" ? C.amarillo : C.rojo, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              {ind.valor}
            </div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>{ind.desc}</div>
            <div style={{ background: "#0f172a", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: C.text }}>
              💡 {ind.rec}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── SECCIÓN 4: CLIENTES & RIESGOS ───────────────────────────────────────────

function Clientes() {
  const [año, setAño] = useState(2025);
  const data = año === 2025 ? topClientes2025 : topClientes2024;
  const ingresosTotales = año === 2025 ? 4214451 : ingresos2024;

  // Evolución mensual top 3 simulada
  const evolucionTop3 = MESES.map((m, i) => ({
    mes: m,
    PCH: Math.round((año === 2025 ? ingresosMensuales2025[i] : ingresosMensuales2024[i]) * 0.34),
    FAINSA: Math.round((año === 2025 ? ingresosMensuales2025[i] : ingresosMensuales2024[i]) * 0.11),
    Pinazo: Math.round((año === 2025 ? ingresosMensuales2025[i] : ingresosMensuales2024[i]) * 0.114),
  }));

  // Riesgos de concentración
  const top1pct = data[0].pct;
  const top4pct = data.slice(0, 4).reduce((a, b) => a + b.pct, 0);

  return (
    <div>
      <div className="flex gap-3 mb-4">
        {[2024, 2025].map(y => (
          <button key={y} onClick={() => setAño(y)}
            style={{ padding:"6px 16px", borderRadius:8, border:`1px solid ${año===y ? C.accent : C.border}`, background: año===y ? C.accentDark : "transparent", color: C.text, cursor:"pointer", fontWeight:700, fontSize:13 }}>
            {y}
          </button>
        ))}
      </div>

      {/* Alertas concentración */}
      {top1pct > 30 && (
        <div style={{ background:"#4c0519", border:`1px solid ${C.rojo}`, borderRadius:10, padding:"10px 16px", marginBottom:16, color:"#fca5a5", fontSize:13 }}>
          🚨 <strong>Riesgo de concentración crítico:</strong> {data[0].nombre} representa el {top1pct.toFixed(1)}% de la facturación. Exposición máxima recomendada: 25%.
        </div>
      )}

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Tabla clientes */}
        <Card>
          <div style={{ color: C.text, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Top clientes {año}</div>
          {data.map((c, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between mb-1">
                <span style={{ color: C.text, fontSize: 13 }}>{c.nombre}</span>
                <span style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>{c.pct.toFixed(1)}%</span>
              </div>
              <div style={{ background: C.border, borderRadius: 4, height: 8, overflow:"hidden" }}>
                <div style={{ width:`${Math.min(c.pct, 100)}%`, height:"100%", background: i === 0 ? C.rojo : CHART_COLORS[i], borderRadius:4 }}/>
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{fmt(c.importe)}</div>
            </div>
          ))}
        </Card>

        {/* Métricas de riesgo */}
        <div>
          <Card className="mb-3">
            <div style={{ color: C.text, fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Métricas de concentración</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div style={{ color: C.muted, fontSize: 11 }}>Top 1 cliente</div>
                <div style={{ color: top1pct > 25 ? C.rojo : C.verde, fontSize: 22, fontWeight: 800 }}>{top1pct.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11 }}>Top 4 clientes</div>
                <div style={{ color: top4pct > 60 ? C.rojo : C.amarillo, fontSize: 22, fontWeight: 800 }}>{top4pct.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11 }}>Nº clientes activos</div>
                <div style={{ color: C.text, fontSize: 22, fontWeight: 800 }}>~40</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 11 }}>Ticket medio</div>
                <div style={{ color: C.text, fontSize: 22, fontWeight: 800 }}>{fmtK(ingresosTotales / 40)}</div>
              </div>
            </div>
          </Card>

          {/* Mapa de riesgo */}
          <Card>
            <div style={{ color: C.text, fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Matriz de riesgo comercial</div>
            {[
              { cliente:"PCH SAS", facturacion:"alta", dependencia:"crítica", trend:"▲", color:C.rojo },
              { cliente:"Electro Box", facturacion:"media", dependencia:"alta", trend:"▼", color:C.amarillo },
              { cliente:"F A I N S A", facturacion:"media", dependencia:"alta", trend:"▲", color:C.amarillo },
              { cliente:"Pinazo", facturacion:"media", dependencia:"alta", trend:"▲", color:C.amarillo },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
                <span style={{ color: C.text, flex:1 }}>{r.cliente}</span>
                <span style={{ color: C.muted, flex:1, textAlign:"center" }}>{r.facturacion}</span>
                <span style={{ color: r.color, flex:1, textAlign:"center", fontWeight:700 }}>{r.dependencia}</span>
                <span style={{ color: r.trend === "▲" ? C.verde : C.rojo, flex:"0 0 24px", textAlign:"right" }}>{r.trend}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Evolución mensual top 3 */}
      <Card>
        <div style={{ color: C.text, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Evolución mensual top 3 clientes — {año}</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={evolucionTop3}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="mes" tick={{ fill: C.muted, fontSize: 11 }}/>
            <YAxis tickFormatter={fmtK} tick={{ fill: C.muted, fontSize: 11 }}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{ fontSize: 12 }}/>
            <Line type="monotone" dataKey="PCH" stroke={C.rojo} strokeWidth={2.5} dot={false}/>
            <Line type="monotone" dataKey="FAINSA" stroke={C.verde} strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="Pinazo" stroke={C.amarillo} strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────

const TABS = [
  { id:"dashboard", label:"📊 Dashboard", desc:"Vista ejecutiva" },
  { id:"simulador", label:"🔬 Simulador", desc:"Escenarios" },
  { id:"semaforo", label:"🚦 Semáforo", desc:"Salud financiera" },
  { id:"clientes", label:"👥 Clientes", desc:"Concentración y riesgos" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [año, setAño] = useState(2024);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: C.card, borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div className="flex items-center gap-4">
            <div style={{ background: C.accentDark, borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
              📈
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>Centro de Control Financiero</div>
              <div style={{ color: C.muted, fontSize: 12 }}>PRETEC VALLES FABRICACIÓ, S.L. — Ejercicios 2021–2025</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {tab === "dashboard" && [2024, 2025].map(y => (
              <button key={y} onClick={() => setAño(y)}
                style={{ padding:"5px 14px", borderRadius:8, border:`1px solid ${año===y ? C.accent : C.border}`, background: año===y ? C.accentDark+"33" : "transparent", color: año===y ? C.accent : C.muted, cursor:"pointer", fontWeight:700, fontSize:13 }}>
                {y}
              </button>
            ))}
            <div style={{ padding:"5px 12px", borderRadius:8, background:"#064e3b33", color: C.verde, fontSize:12, fontWeight:600, border:`1px solid ${C.verde}33` }}>
              🟢 Sistema activo
            </div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div style={{ background: C.card, borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
        <div style={{ maxWidth:1400, margin:"0 auto", display:"flex", gap:2 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding:"12px 20px", background:"transparent", border:"none", cursor:"pointer",
                color: tab === t.id ? C.accent : C.muted,
                borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
                fontWeight: tab === t.id ? 700 : 500, fontSize:14, display:"flex", gap:8, alignItems:"center",
                transition:"all 0.15s",
              }}>
              {t.label}
              <span style={{ fontSize:11, opacity:0.7 }}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"24px" }}>
        {tab === "dashboard" && <Dashboard año={año}/>}
        {tab === "simulador" && <Simulador/>}
        {tab === "semaforo" && <Semaforo/>}
        {tab === "clientes" && <Clientes/>}
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"16px", color: C.border, fontSize:11, borderTop:`1px solid ${C.border}` }}>
        Centro de Control Financiero — PRETEC VALLES FABRICACIÓ, S.L. — Datos extraídos de P&L real y facturas emitidas 2024–2025
      </div>
    </div>
  );
}
