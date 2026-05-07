import{j as e,B as v,r as f}from"./index-DXDtJeHK.js";import{g as N,e as z,u as B,T as y,a as A}from"./apiClient-CuCB6fhG.js";import{I as j}from"./InlineError-CVLoRB1J.js";import{S as F}from"./ScreenshotUpload-JVNXZGmt.js";import{P as T,L as C,M as E}from"./PanelHeader-BN1A-szq.js";const P=`Du bist ein erfahrener Business Analyst und Technical Writer in einem Schweizer Versicherungsunternehmen. Du erstellst fachtechnische Dokumentationen für umgesetzte User Stories. Deine Zielgruppe sind Fachstakeholder und Business Analysten ohne tiefes technisches Vorwissen.

Erstelle eine strukturierte Dokumentation auf Deutsch basierend auf dem folgenden Input. Halte dich strikt an die vorgegebene Struktur. Generiere ausschliesslich Abschnitte, für die Input vorhanden ist. Lasse Abschnitte vollständig weg, wenn kein entsprechender Input vorhanden ist – erfinde oder ergänze keinen Inhalt.

Schreibe klar, präzise und fachlich korrekt. Vermeide Fülltext und generische Formulierungen. Der Output soll direkt in Confluence verwendbar sein.

Verwende folgende Struktur:

# [Story-Titel]

## Kontext & Ziel
Worum geht es, und warum wurde diese Änderung umgesetzt?

## Betroffene Nutzergruppe
Für wen ist diese Änderung relevant?

## Was wurde umgesetzt
Konkrete Beschreibung der umgesetzten Funktionalität aus Nutzerperspektive.

## Benutzeroberfläche
[Nur generieren wenn Screenshot vorhanden] Beschreibung der relevanten UI-Elemente und des Ablaufs.

## Wichtige technische Details
[Nur generieren wenn Code vorhanden] Relevante Implementierungsdetails, die fachlich oder architektonisch bedeutsam sind.

## Hinweise & Einschränkungen
Bekannte Limitierungen, Sonderfälle, Abhängigkeiten, offene Folgearbeiten.

## Abnahme & Deployment
[Nur generieren wenn Abnahme oder Datum vorhanden] Wer hat abgenommen, wann erfolgte das PROD-Deployment.`,M=`Du bist ein erfahrener Business Analyst und Technical Writer in einem Schweizer Versicherungsunternehmen. Du erstellst fachtechnische Dokumentationen für umgesetzte Features und Capabilities. Deine Zielgruppe sind Fachstakeholder, Business Analysten und Product Manager.

Erstelle eine strukturierte Feature-Dokumentation auf Deutsch basierend auf dem folgenden Input. Halte dich strikt an die vorgegebene Struktur. Generiere ausschliesslich Abschnitte, für die Input vorhanden ist. Lasse Abschnitte vollständig weg, wenn kein entsprechender Input vorhanden ist – erfinde oder ergänze keinen Inhalt.

Schreibe klar, präzise und auf einer Überblicksebene. Synthetisiere mehrere Stories zu einem kohärenten Ganzen. Der Output soll direkt in Confluence verwendbar sein.

Verwende folgende Struktur:

# [Feature-Titel]

## Feature-Überblick
Was ist dieses Feature, welchen Mehrwert liefert es für Nutzer und Business?

## Betroffene Nutzergruppen
Welche Rollen oder Nutzertypen sind betroffen?

## Enthaltene Funktionalitäten
Übersicht der wesentlichen Funktionen mit kurzer Beschreibung je Funktion.

## Benutzeroberfläche & Ablauf
[Nur generieren wenn Screenshot vorhanden] Überblick über relevante UI-Bereiche und typischen Nutzerfluss.

## Architektur & technische Einordnung
[Nur generieren wenn Code oder Architekturnotizen vorhanden] Technische Einordnung, relevante Designentscheide, Schnittstellen.

## Abhängigkeiten & Voraussetzungen
Was muss gegeben sein, damit das Feature funktioniert?

## Bekannte Einschränkungen & offene Punkte
Was ist bewusst nicht Teil dieses Features, welche Folgearbeiten sind bekannt?

## Versionierung & Historie
[Nur generieren wenn Deployment-Datum oder Verantwortliche vorhanden] Deployment-Datum, enthaltene Stories, verantwortliche Person.`;function R(t){const n=[];return n.push(`**Titel:** ${t.title}`),n.push(""),n.push(`**Story-Beschreibung / Akzeptanzkriterien:**
${t.description}`),t.confluenceSpec.trim()&&(n.push(""),n.push(`**Confluence-Spezifikation:**
${t.confluenceSpec.trim()}`)),t.code.trim()&&(n.push(""),n.push(`**Code / PR-Beschreibung:**
${t.code.trim()}`)),t.acceptedBy.trim()&&(n.push(""),n.push(`**Abnahme durch:** ${t.acceptedBy.trim()}`)),t.deploymentDate.trim()&&(n.push(""),n.push(`**Deployment-Datum:** ${t.deploymentDate.trim()}`)),n.join(`
`)}function $(t){const n=[];return n.push(`**Titel:** ${t.title}`),n.push(""),n.push(`**Feature-Beschreibung:**
${t.description}`),n.push(""),n.push(`**Enthaltene Stories:**
${t.stories}`),t.confluenceSpec.trim()&&(n.push(""),n.push(`**Confluence-Spezifikation:**
${t.confluenceSpec.trim()}`)),t.code.trim()&&(n.push(""),n.push(`**Code / Architekturnotizen:**
${t.code.trim()}`)),t.responsible.trim()&&(n.push(""),n.push(`**Verantwortlich:** ${t.responsible.trim()}`)),t.deploymentDate.trim()&&(n.push(""),n.push(`**Deployment-Datum:** ${t.deploymentDate.trim()}`)),n.join(`
`)}async function O(t){const n=N(),o=t.mode==="story"?P:M,h=t.mode==="story"?4e3:6e3,r=t.mode==="story"?R(t.input):$(t.input),l=[{type:"text",text:t.screenshots.length>0?`${r}

Die angehängten Screenshots zeigen das entwickelte UI. Nutze sie als zusätzlichen Kontext für die Dokumentation.`:r}];for(const p of t.screenshots){const b=p.file.type;l.push({type:"image",source:{type:"base64",media_type:b,data:p.base64}})}const d=new Promise((p,b)=>setTimeout(()=>b(new Error("Zeitüberschreitung nach 60 Sekunden. Bitte erneut versuchen.")),6e4)),m=n.messages.create({model:"claude-sonnet-4-5",max_tokens:h,system:o,messages:[{role:"user",content:l}]}),g=await Promise.race([m,d]),s=z(g.content);if(!s.trim())throw new Error("Die Dokumentation konnte nicht generiert werden. Bitte erneut versuchen.");return s}function G(){return B({mutationFn:O})}const x=[{id:"story",label:"Story Mode"},{id:"feature",label:"Feature Mode"}];function V({value:t,onChange:n,disabled:o}){const h=(r,c)=>{let a=c;if(r.key==="ArrowRight")a=(c+1)%x.length;else if(r.key==="ArrowLeft")a=(c-1+x.length)%x.length;else if(r.key==="Home")a=0;else if(r.key==="End")a=x.length-1;else return;r.preventDefault(),n(x[a].id)};return e.jsx("div",{role:"tablist","aria-label":"Dokumentations-Modus auswählen",className:"flex border-b border-edge",children:x.map((r,c)=>{const a=r.id===t;return e.jsx("button",{role:"tab",id:`dg-tab-${r.id}`,"aria-selected":a,"aria-controls":a?`dg-panel-${r.id}`:void 0,tabIndex:a?0:-1,disabled:o,onClick:()=>n(r.id),onKeyDown:l=>h(l,c),className:["flex-1 py-3 text-xs font-medium transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset disabled:opacity-50 disabled:cursor-not-allowed",a?"border-brand text-brand":"border-transparent text-ink-secondary hover:text-ink hover:border-edge"].join(" "),children:r.label},r.id)})})}function W({mode:t,storyInput:n,featureInput:o,screenshots:h,isLoading:r,error:c,onModeChange:a,onStoryChange:l,onFeatureChange:d,onScreenshotsChange:m,onSubmit:g}){const s=t==="story",p=s?n.title:o.title,b=s?n.description:o.description,w=s?!n.title.trim()||!n.description.trim():!o.title.trim()||!o.description.trim()||!o.stories.trim();return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"font-serif text-2xl font-semibold text-ink mb-1",children:"Doc Generator"}),e.jsx("p",{className:"text-sm text-ink-secondary",children:"Fachtechnische Dokumentation für Confluence automatisch generieren."})]}),e.jsx(V,{value:t,onChange:a,disabled:r}),e.jsxs("form",{id:`dg-panel-${t}`,role:"tabpanel","aria-labelledby":`dg-tab-${t}`,onSubmit:g,className:"space-y-5",noValidate:!0,children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"dg-title",className:"block text-sm font-medium text-ink mb-1",children:s?"Story-Titel":"Feature-Titel"}),e.jsx("input",{id:"dg-title",type:"text",value:p,onChange:i=>s?l({title:i.target.value}):d({title:i.target.value}),placeholder:s?"z.B. Login mit E-Mail und Passwort":"z.B. Benutzerverwaltung",disabled:r,className:"w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"})]}),e.jsx(y,{id:"dg-description",label:s?"Story-Beschreibung / Akzeptanzkriterien":"Feature-Beschreibung",value:b,onChange:i=>s?l({description:i}):d({description:i}),placeholder:s?`Als Nutzer möchte ich...

AK-1: ...
AK-2: ...`:"Übergeordnete Beschreibung des Features, Ziel und Mehrwert für Nutzer und Business.",rows:8,autoGrow:!0,disabled:r}),!s&&e.jsx(y,{id:"dg-stories",label:"Enthaltene Stories",value:o.stories,onChange:i=>d({stories:i}),placeholder:`Story 1: Als Nutzer möchte ich...
Story 2: Als Admin möchte ich...`,rows:5,autoGrow:!0,disabled:r}),e.jsx(F,{files:h,onChange:m,disabled:r,maxFiles:s?3:1}),e.jsx(y,{id:"dg-confluence",label:"Confluence-Spezifikation – Optional",value:s?n.confluenceSpec:o.confluenceSpec,onChange:i=>s?l({confluenceSpec:i}):d({confluenceSpec:i}),placeholder:"Freitext aus Confluence: Spezifikation, Kommentare, Notizen…",rows:4,autoGrow:!0,disabled:r}),e.jsx(y,{id:"dg-code",label:s?"Code / PR-Beschreibung – Optional":"Code / Architekturnotizen – Optional",value:s?n.code:o.code,onChange:i=>s?l({code:i}):d({code:i}),placeholder:s?"PR-Beschreibung, relevante Code-Snippets oder Dateiinhalte…":"Technische Details, relevante Implementierungsentscheide, Schnittstellen…",rows:4,autoGrow:!0,disabled:r}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-4",children:[s?e.jsxs("div",{children:[e.jsxs("label",{htmlFor:"dg-accepted-by",className:"block text-sm font-medium text-ink mb-1",children:["Abnahme durch ",e.jsx("span",{className:"font-normal text-ink-tertiary",children:"– Optional"})]}),e.jsx("input",{id:"dg-accepted-by",type:"text",value:n.acceptedBy,onChange:i=>l({acceptedBy:i.target.value}),placeholder:"Name der abnehmenden Person",disabled:r,className:"w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"})]}):e.jsxs("div",{children:[e.jsxs("label",{htmlFor:"dg-responsible",className:"block text-sm font-medium text-ink mb-1",children:["Verantwortlich ",e.jsx("span",{className:"font-normal text-ink-tertiary",children:"– Optional"})]}),e.jsx("input",{id:"dg-responsible",type:"text",value:o.responsible,onChange:i=>d({responsible:i.target.value}),placeholder:"Name des verantwortlichen PO oder BA",disabled:r,className:"w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"})]}),e.jsxs("div",{children:[e.jsxs("label",{htmlFor:"dg-deployment-date",className:"block text-sm font-medium text-ink mb-1",children:["Deployment-Datum ",e.jsx("span",{className:"font-normal text-ink-tertiary",children:"– Optional"})]}),e.jsx("input",{id:"dg-deployment-date",type:"date",value:s?n.deploymentDate:o.deploymentDate,onChange:i=>s?l({deploymentDate:i.target.value}):d({deploymentDate:i.target.value}),disabled:r,className:"w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:cursor-not-allowed"})]})]}),c&&e.jsx(j,{message:c instanceof Error?c.message:"Fehler bei der Generierung. Bitte erneut versuchen."}),e.jsx(v,{type:"submit",disabled:w,loading:r,className:"w-full",children:r?"Dokumentation wird generiert…":"Dokumentation generieren"}),e.jsx("p",{"aria-live":"polite",className:"sr-only",children:r?"Dokumentation wird generiert, bitte warten.":""})]})]})}function I({markdown:t,isLoading:n,error:o,onRegenerate:h,onReset:r,contentRef:c}){const{copied:a,copy:l}=A();return e.jsxs("div",{className:"max-w-3xl mx-auto px-6 py-8",role:"region","aria-label":"Generierte Dokumentation",children:[e.jsx(T,{title:"Generierte Dokumentation"}),e.jsxs("div",{ref:c,tabIndex:-1,"aria-live":"polite","aria-busy":n,className:"outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset rounded",children:[n&&e.jsxs("div",{className:"py-5",children:[e.jsx("p",{className:"text-sm text-ink-secondary mb-4",children:"Dokumentation wird generiert…"}),e.jsx(C,{lines:10})]}),!n&&t&&e.jsxs("div",{className:"py-5",children:[e.jsx(E,{children:t}),e.jsxs("div",{className:"mt-8 space-y-3",children:[e.jsx(v,{onClick:()=>l(t),variant:"primary","aria-label":a?"Dokumentation kopiert":"Dokumentation kopieren",className:"w-full",children:a?e.jsxs(e.Fragment,{children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24","aria-hidden":"true",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 13l4 4L19 7"})}),e.jsx("span",{"aria-live":"polite",children:"Kopiert!"})]}):e.jsxs(e.Fragment,{children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24","aria-hidden":"true",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"})}),e.jsx("span",{"aria-live":"polite",children:"Kopieren"})]})}),e.jsx(v,{onClick:h,variant:"secondary",disabled:n,className:"w-full",children:"Neu generieren"}),o&&e.jsx(j,{message:o.message}),e.jsx(v,{onClick:r,variant:"outline",disabled:n,className:"w-full",children:"Zurücksetzen"})]})]})]})]})}const S={title:"",description:"",confluenceSpec:"",code:"",acceptedBy:"",deploymentDate:""},D={title:"",description:"",stories:"",confluenceSpec:"",code:"",responsible:"",deploymentDate:""};function K(t){return!!(t.title.trim()||t.description.trim()||t.confluenceSpec.trim()||t.code.trim())}function H(t){return!!(t.title.trim()||t.description.trim()||t.stories.trim()||t.confluenceSpec.trim()||t.code.trim())}function J(){const[t,n]=f.useState("story"),[o,h]=f.useState("input"),[r,c]=f.useState(S),[a,l]=f.useState(D),[d,m]=f.useState([]),g=f.useRef(null),s=G();f.useEffect(()=>{var u;o==="output"&&((u=g.current)==null||u.focus())},[o]);function p(u){u===t||(t==="story"?K(r):H(a))&&!window.confirm("Beim Wechsel des Modus gehen die Eingaben verloren. Fortfahren?")||(n(u),c(S),l(D),m([]),s.reset())}async function b(u){u.preventDefault();try{await s.mutateAsync(t==="story"?{mode:"story",input:r,screenshots:d}:{mode:"feature",input:a,screenshots:d}),h("output")}catch{}}async function w(){try{await s.mutateAsync(t==="story"?{mode:"story",input:r,screenshots:d}:{mode:"feature",input:a,screenshots:d})}catch{}}function i(){window.confirm("Formular und Output zurücksetzen?")&&(h("input"),c(S),l(D),m([]),s.reset())}return e.jsx("main",{id:"main-content",className:"flex-1 overflow-auto bg-canvas",children:o==="input"?e.jsx("div",{className:"max-w-3xl mx-auto px-6 py-8",children:e.jsx(W,{mode:t,storyInput:r,featureInput:a,screenshots:d,isLoading:s.isPending,error:s.error,onModeChange:p,onStoryChange:u=>c(k=>({...k,...u})),onFeatureChange:u=>l(k=>({...k,...u})),onScreenshotsChange:m,onSubmit:b})}):s.data?e.jsx(I,{markdown:s.data,isLoading:s.isPending,error:s.error,onRegenerate:w,onReset:i,contentRef:g}):null})}export{J as DocGeneratorPage};
