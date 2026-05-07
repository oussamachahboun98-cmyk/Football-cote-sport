“use client”;
import { useState, useEffect, useRef } from “react”;

const LEAGUES = [
{ id: 307, name: “الدوري السعودي”,      flag: “🇸🇦”, season: 2024 },
{ id: 140, name: “الدوري الإسباني”,      flag: “🇪🇸”, season: 2024 },
{ id: 39,  name: “الدوري الإنجليزي”,     flag: “🏴󠁧󠁢󠁥󠁮󠁧󠁿”, season: 2024 },
{ id: 135, name: “الدوري الإيطالي”,      flag: “🇮🇹”, season: 2024 },
{ id: 78,  name: “الدوري الألماني”,      flag: “🇩🇪”, season: 2024 },
{ id: 61,  name: “الدوري الفرنسي”,       flag: “🇫🇷”, season: 2024 },
{ id: 2,   name: “دوري أبطال أوروبا”,    flag: “🏆”, season: 2024 },
];

const AGENTS = [
{ id: “fetch”,   name: “عميل البيانات”,   icon: “📡”, color: “#00e5ff” },
{ id: “scout”,   name: “عميل الاستطلاع”, icon: “🔍”, color: “#00ff9d” },
{ id: “stats”,   name: “عميل الإحصاء”,   icon: “📊”, color: “#a78bfa” },
{ id: “predict”, name: “عميل التنبؤ”,    icon: “🎯”, color: “#ff9500” },
];

// All API calls go through our own Next.js route (no CORS!)
const apiFetch = async (path) => {
const res = await fetch(`/api/football?path=${encodeURIComponent(path)}`);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const json = await res.json();
if (json.errors && Object.keys(json.errors).length > 0)
throw new Error(Object.values(json.errors)[0]);
return json;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
const [selectedLeague, setSelectedLeague] = useState(LEAGUES[0]);
const [teams, setTeams]       = useState([]);
const [team1, setTeam1]       = useState(null);
const [team2, setTeam2]       = useState(null);
const [loadingTeams, setLoadingTeams] = useState(false);
const [apiStatus, setApiStatus] = useState(“checking”);
const [apiMsg, setApiMsg]     = useState(””);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [agentState, setAgentState]   = useState({});
const [logs, setLogs]         = useState([]);
const [report, setReport]     = useState(null);
const [liveMatches, setLiveMatches] = useState([]);
const logsRef = useRef(null);

useEffect(() => { checkApi(); fetchLive(); }, []);
useEffect(() => { if (selectedLeague) loadTeams(); }, [selectedLeague]);
useEffect(() => { if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight; }, [logs]);

const addLog = (agentId, msg, type = “info”) =>
setLogs((p) => […p, { agentId, msg, type, time: new Date().toLocaleTimeString(“ar-SA”) }]);

const checkApi = async () => {
try {
const d = await apiFetch(”/status”);
setApiMsg(d.response?.subscription?.plan || “Free”);
setApiStatus(“ok”);
} catch (e) { setApiStatus(“error”); setApiMsg(e.message); }
};

const fetchLive = async () => {
try {
const d = await apiFetch(”/fixtures?live=all”);
setLiveMatches((d.response || []).slice(0, 5));
} catch {}
};

const loadTeams = async () => {
setLoadingTeams(true); setTeams([]); setTeam1(null); setTeam2(null); setReport(null);
try {
const d = await apiFetch(`/teams?league=${selectedLeague.id}&season=${selectedLeague.season}`);
const list = (d.response || []).map((t) => ({ id: t.team.id, name: t.team.name, logo: t.team.logo }));
setTeams(list);
if (list.length >= 2) { setTeam1(list[0]); setTeam2(list[1]); }
} catch (e) { addLog(“fetch”, `فشل: ${e.message}`, “error”); }
setLoadingTeams(false);
};

const runAnalysis = async () => {
if (!team1 || !team2 || team1.id === team2.id) return;
setIsAnalyzing(true); setLogs([]); setReport(null); setAgentState({});
try {
setAgentState((p) => ({ …p, fetch: “running” }));
addLog(“fetch”, “📡 جلب البيانات من API-Football…”);

```
  const [f1r, f2r, h2hr, s1r, s2r] = await Promise.all([
    apiFetch(`/fixtures?team=${team1.id}&last=5&season=${selectedLeague.season}`),
    apiFetch(`/fixtures?team=${team2.id}&last=5&season=${selectedLeague.season}`),
    apiFetch(`/fixtures/headtohead?h2h=${team1.id}-${team2.id}&last=5`),
    apiFetch(`/teams/statistics?team=${team1.id}&league=${selectedLeague.id}&season=${selectedLeague.season}`),
    apiFetch(`/teams/statistics?team=${team2.id}&league=${selectedLeague.id}&season=${selectedLeague.season}`),
  ]);

  const fix1 = f1r.response || [], fix2 = f2r.response || [], h2h = h2hr.response || [];
  const st1 = s1r.response, st2 = s2r.response;
  addLog("fetch", `✅ ${fix1.length + fix2.length + h2h.length} مباراة حقيقية`, "success");
  setAgentState((p) => ({ ...p, fetch: "done" }));

  setAgentState((p) => ({ ...p, scout: "running" }));
  const getForm = (fx, tid) => fx.slice(0,5).map((f) => {
    const h = f.teams.home.id === tid;
    const gh = f.goals.home ?? 0, ga = f.goals.away ?? 0;
    if (f.goals.home === null) return "؟";
    return h ? (gh>ga?"ف":gh===ga?"ت":"خ") : (ga>gh?"ف":ga===gh?"ت":"خ");
  }).join(" ");
  const form1 = getForm(fix1, team1.id), form2 = getForm(fix2, team2.id);
  addLog("scout", `${team1.name}: ${form1||"—"}`, "success");
  addLog("scout", `${team2.name}: ${form2||"—"}`, "success");
  const h2hSummary = h2h.slice(0,3).map((g) =>
    `${g.teams.home.name} ${g.goals.home}-${g.goals.away} ${g.teams.away.name}`
  ).join(" | ") || "لا توجد مواجهات";
  addLog("scout", `H2H: ${h2hSummary}`, "info");
  setAgentState((p) => ({ ...p, scout: "done" }));

  setAgentState((p) => ({ ...p, stats: "running" }));
  const gf1=st1?.goals?.for?.average?.total||"—", gf2=st2?.goals?.for?.average?.total||"—";
  const ga1=st1?.goals?.against?.average?.total||"—", ga2=st2?.goals?.against?.average?.total||"—";
  const w1=st1?.fixtures?.wins?.total||0, w2=st2?.fixtures?.wins?.total||0;
  const d1=st1?.fixtures?.draws?.total||0, d2=st2?.fixtures?.draws?.total||0;
  const l1=st1?.fixtures?.loses?.total||0, l2=st2?.fixtures?.loses?.total||0;
  const p1=st1?.fixtures?.played?.total||1, p2=st2?.fixtures?.played?.total||1;
  addLog("stats", `${team1.name}: ${gf1} أهداف | ${ga1} مستقبَلة`, "success");
  addLog("stats", `${team2.name}: ${gf2} أهداف | ${ga2} مستقبَلة`, "success");
  setAgentState((p) => ({ ...p, stats: "done" }));

  setAgentState((p) => ({ ...p, predict: "running" }));
  addLog("predict", "إرسال البيانات لـ Claude AI...");

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1000,
      messages: [{ role: "user", content: `حلّل هذه المباراة بناءً على بيانات حقيقية:
```

${team1.name} vs ${team2.name} — ${selectedLeague.name}
شكل ${team1.name}: ${form1} | شكل ${team2.name}: ${form2}
${team1.name}: ${gf1}أهداف/م، ${ga1}مستقبَلة/م، ${w1}ف${d1}ت${l1}خ من ${p1}
${team2.name}: ${gf2}أهداف/م، ${ga2}مستقبَلة/م، ${w2}ف${d2}ت${l2}خ من ${p2}
H2H: ${h2hSummary}
أجب بـ JSON فقط:
{“t1_win”:“نسبة%”,“draw”:“نسبة%”,“t2_win”:“نسبة%”,“score”:“2-1”,“over25”:“نسبة%”,“btts”:“نسبة%”,“best_bet”:“نص”,“bet_reason”:“نص”,“risk”:“منخفض أو متوسط أو عالي”,“confidence”:“نسبة%”,“key_factor”:“نص”,“analysis”:“نص 3 جمل”,“warning”:“نص”}`}], }), }); const aiJson = await aiRes.json(); const ai = JSON.parse(aiJson.content.map((c) => c.text||"").join("").replace(/```json|```/g,"").trim()); addLog("predict",`✅ ثقة: ${ai.confidence} | ${ai.best_bet}`, "success"); setAgentState((p) => ({ ...p, predict: "done" })); setReport({ team1, team2, form1, form2, gf1, gf2, ga1, ga2, w1, w2, d1, d2, l1, l2, p1, p2, h2hSummary, ai }); } catch (e) { addLog("fetch", `❌ ${e.message}`, “error”); }
setIsAnalyzing(false);
};

const rc = (r) => r===“منخفض”?”#00ff9d”:r===“متوسط”?”#ff9500”:”#ff3d71”;

return (
<div style={{ minHeight:“100vh”, background:”#05080f”, color:”#dce8f5”, direction:“rtl”, padding:“0” }}>
<style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes scan{0%{top:0}100%{top:100%}} .log-row{animation:fadeUp .2s ease} .spin{animation:spin .9s linear infinite;display:inline-block} .pulse{animation:pulse 1.4s ease infinite} *{box-sizing:border-box;margin:0;padding:0} select{appearance:none;cursor:pointer;font-family:'Tajawal',sans-serif} select:focus{outline:none}`}</style>

```
  {/* HEADER */}
  <div style={{background:"#0a1628",borderBottom:"1px solid #0e2240",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:26}}>⚽</span>
      <div>
        <div style={{fontSize:17,fontWeight:900}}>
          <span style={{color:"#00ff9d"}}>SPORTS</span><span style={{color:"#00e5ff"}}>AI</span>
          <span style={{color:"#2a4a6f",fontSize:11,marginRight:6}}>بيانات حقيقية</span>
        </div>
        <div style={{fontSize:9,color:"#1a3a5f",letterSpacing:"2px"}}>API-FOOTBALL • CLAUDE AI</div>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6,background:"#060a12",border:"1px solid #0e2240",borderRadius:16,padding:"5px 12px"}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:apiStatus==="ok"?"#00ff9d":apiStatus==="error"?"#ff3d71":"#ff9500"}} className={apiStatus==="checking"?"pulse":""} />
      <span style={{fontSize:10,color:"#3a6a9f"}}>{apiStatus==="ok"?`✓ ${apiMsg}`:apiStatus==="error"?`✗ ${apiMsg}`:"فحص..."}</span>
    </div>
  </div>

  {/* LIVE */}
  {liveMatches.length>0&&<div style={{background:"#080e18",borderBottom:"1px solid #ff3d7115",padding:"8px 20px",display:"flex",alignItems:"center",gap:14,overflowX:"auto"}}>
    <span style={{background:"#ff3d71",color:"#fff",fontSize:9,fontWeight:900,padding:"2px 7px",borderRadius:4,whiteSpace:"nowrap"}}>🔴 LIVE</span>
    {liveMatches.map((m,i)=><span key={i} style={{fontSize:11,color:"#4a7aaa",whiteSpace:"nowrap",borderRight:i<liveMatches.length-1?"1px solid #0e2240":"none",paddingLeft:12}}>
      {m.teams.home.name} <b style={{color:"#ff9500"}}>{m.goals.home??0}-{m.goals.away??0}</b> {m.teams.away.name}
    </span>)}
  </div>}

  <div style={{padding:"18px 22px",maxWidth:1080,margin:"0 auto"}}>
    {/* SETUP */}
    <div style={{background:"#0a1628",border:"1px solid #0e2240",borderRadius:12,padding:"18px",marginBottom:16}}>
      <div style={{fontSize:10,color:"#1a4a7f",letterSpacing:"2px",marginBottom:12,fontWeight:700}}>⚙ إعداد المباراة</div>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
        <div>
          <div style={{fontSize:10,color:"#1a4a7f",marginBottom:5}}>البطولة</div>
          <select value={selectedLeague.id} onChange={e=>setSelectedLeague(LEAGUES.find(l=>l.id===+e.target.value))}
            style={{width:"100%",padding:"8px 12px",borderRadius:8,background:"#060a12",border:"1px solid #0e2240",color:"#8aaccc",fontSize:13}}>
            {LEAGUES.map(l=><option key={l.id} value={l.id}>{l.flag} {l.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:10,color:"#00ff9d70",marginBottom:5}}>الفريق الأول</div>
          <select value={team1?.id||""} onChange={e=>setTeam1(teams.find(t=>t.id===+e.target.value))} disabled={loadingTeams}
            style={{width:"100%",padding:"8px 12px",borderRadius:8,background:"#060a12",border:"1px solid #00ff9d20",color:"#00ff9d",fontSize:13,fontWeight:700}}>
            {loadingTeams?<option>تحميل...</option>:teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:10,color:"#ff3d7170",marginBottom:5}}>الفريق الثاني</div>
          <select value={team2?.id||""} onChange={e=>setTeam2(teams.find(t=>t.id===+e.target.value))} disabled={loadingTeams}
            style={{width:"100%",padding:"8px 12px",borderRadius:8,background:"#060a12",border:"1px solid #ff3d7120",color:"#ff3d71",fontSize:13,fontWeight:700}}>
            {loadingTeams?<option>تحميل...</option>:teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button onClick={runAnalysis} disabled={isAnalyzing||loadingTeams||!team1||!team2}
          style={{padding:"8px 20px",borderRadius:8,border:"none",background:isAnalyzing?"#0e2240":"linear-gradient(135deg,#00ff9d,#00c3ff)",color:isAnalyzing?"#1a4a7f":"#05080f",fontSize:13,fontWeight:900,cursor:isAnalyzing?"not-allowed":"pointer"}}>
          {isAnalyzing?<span className="spin">⚙</span>:"🚀"} {isAnalyzing?"تحليل...":"تشغيل"}
        </button>
      </div>
    </div>

    {/* AGENTS */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {AGENTS.map(ag=>{const s=agentState[ag.id];return(
        <div key={ag.id} style={{background:s==="running"?`${ag.color}10`:"#0a1628",border:`1px solid ${s==="running"?ag.color+"50":s==="done"?ag.color+"20":"#0e2240"}`,borderRadius:10,padding:"12px",position:"relative",overflow:"hidden",transition:"all .3s"}}>
          {s==="running"&&<div style={{position:"absolute",left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${ag.color},transparent)`,animation:"scan 1s linear infinite"}}/>}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{ag.icon}</span>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:s==="running"?ag.color:s==="done"?ag.color+"aa":"#2a5a7f"}}>{ag.name}</div>
              <div style={{fontSize:9,color:s==="running"?ag.color+"cc":s==="done"?"#00ff9d60":"#1a3a5f"}}>{s==="running"?"● يعمل":s==="done"?"✓ اكتمل":"○ انتظار"}</div>
            </div>
          </div>
        </div>
      );})}
    </div>

    {/* MAIN GRID */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.35fr",gap:14}}>
      {/* LOGS */}
      <div style={{background:"#0a1628",border:"1px solid #0e2240",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:"1px solid #0e2240",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#00e5ff"}} className={isAnalyzing?"pulse":""}/>
          <span style={{fontSize:10,color:"#2a5a7f",fontWeight:700}}>سجل النشاط</span>
        </div>
        <div ref={logsRef} style={{height:320,overflowY:"auto",padding:10}}>
          {logs.length===0?<div style={{textAlign:"center",color:"#1a3a5f",paddingTop:90,fontSize:12}}>اضغط تشغيل لبدء التحليل</div>
          :logs.map((log,i)=>{const ag=AGENTS.find(a=>a.id===log.agentId);return(
            <div key={i} className="log-row" style={{display:"flex",gap:6,marginBottom:5,alignItems:"flex-start"}}>
              <span style={{fontSize:9,color:"#1a3a5f",whiteSpace:"nowrap"}}>{log.time}</span>
              <span style={{fontSize:9,color:ag?.color+"80",whiteSpace:"nowrap",fontWeight:700}}>[{ag?.icon}]</span>
              <span style={{fontSize:11,lineHeight:1.5,color:log.type==="success"?"#00ff9d":log.type==="error"?"#ff3d71":log.type==="highlight"?"#ff9500":"#4a7aaa"}}>{log.msg}</span>
            </div>
          );})}
        </div>
      </div>

      {/* REPORT */}
      <div style={{background:"#0a1628",border:`1px solid ${report?"#00ff9d20":"#0e2240"}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"10px 14px",borderBottom:"1px solid #0e2240",display:"flex",alignItems:"center",gap:8}}>
          <span>🎯</span>
          <span style={{fontSize:10,color:"#2a5a7f",fontWeight:700}}>التقرير النهائي</span>
          {report&&<span style={{marginRight:"auto",fontSize:9,color:"#00ff9d50",border:"1px solid #00ff9d15",borderRadius:4,padding:"1px 6px"}}>بيانات حقيقية ✓</span>}
        </div>
        <div style={{height:320,overflowY:"auto",padding:14}}>
          {!report?<div style={{textAlign:"center",color:"#1a3a5f",paddingTop:isAnalyzing?50:90,fontSize:12}}>
            {isAnalyzing?<><div style={{fontSize:26,marginBottom:8}} className="spin">⚙</div><div>جاري التحليل...</div></>:"اختر المباراة وشغّل الوكلاء"}
          </div>:(
            <div style={{animation:"fadeUp .4s ease"}}>
              <div style={{background:"#060a12",border:"1px solid #0e2a40",borderRadius:10,padding:14,textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:16,fontWeight:900}}><span style={{color:"#00ff9d"}}>{report.team1.name}</span><span style={{color:"#1a3a5f",margin:"0 8px",fontSize:11}}>VS</span><span style={{color:"#ff3d71"}}>{report.team2.name}</span></div>
                <div style={{fontSize:28,fontWeight:900,color:"#fff",letterSpacing:3,marginTop:4}}>{report.ai.score}</div>
                <div style={{fontSize:9,color:"#2a5a7f"}}>النتيجة المتوقعة</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>
                {[{l:report.team1.name,v:report.ai.t1_win,c:"#00ff9d"},{l:"تعادل",v:report.ai.draw,c:"#ff9500"},{l:report.team2.name,v:report.ai.t2_win,c:"#ff3d71"}].map(o=>(
                  <div key={o.l} style={{background:`${o.c}08`,border:`1px solid ${o.c}20`,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:900,color:o.c}}>{o.v}</div>
                    <div style={{fontSize:9,color:"#2a5a7f",marginTop:2}}>{o.l}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#ff950012",border:"1px solid #ff950030",borderRadius:9,padding:"10px 12px",marginBottom:10,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:18}}>⭐</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:"#ff9500",fontWeight:700,marginBottom:2}}>أفضل رهان</div>
                  <div style={{fontSize:13,color:"#fff",fontWeight:700}}>{report.ai.best_bet}</div>
                  <div style={{fontSize:10,color:"#5a7a9f",marginTop:3}}>{report.ai.bet_reason}</div>
                </div>
                <div style={{background:rc(report.ai.risk)+"15",border:`1px solid ${rc(report.ai.risk)}35`,borderRadius:6,padding:"3px 8px",fontSize:9,color:rc(report.ai.risk),fontWeight:700}}>{report.ai.risk}</div>
              </div>
              <div style={{background:"#060a12",border:"1px solid #0e2240",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                <div style={{fontSize:9,color:"#2a5a7f",fontWeight:700,marginBottom:5}}>📋 التحليل</div>
                <div style={{fontSize:11,color:"#4a7aaa",lineHeight:1.8}}>{report.ai.analysis}</div>
              </div>
              <div style={{background:"#ff3d7108",border:"1px solid #ff3d7118",borderRadius:8,padding:"8px 12px",display:"flex",gap:8}}>
                <span>⚠️</span>
                <div style={{fontSize:10,color:"#ff3d7170",lineHeight:1.6}}>{report.ai.warning}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
```

);
}
