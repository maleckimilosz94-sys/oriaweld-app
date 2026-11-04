/* Oriaweld Approximate — ETAP 4.3: klucze i18n PL dla P2 (EN/DE: TODO, NEEDS_REVIEW). text(q) -> tekst z q.i18n + q.params. */
(function(root){'use strict';
var PL={
 'approx.q_type_bent':'Czy to blacha gięta z kołnierzami (nie płaska płyta)?',
 'approx.q_type_flat':'Czy to płaska płyta?',
 'approx.q_bend':'W którą stronę gięty jest dolny kołnierz {fb} mm (45°)? Kierunek zgadnięty z izometrii.',
 'approx.q_tabs':'Gdzie są zaczepy pod kołnierzem dolnym? Pozycje zgadnięte (wymiary 124/160 nieprzypisane).',
 'approx.q_r16_est':'Promień gięcia szacowany na R{R} (brak w OCR). Podaj promień gięcia w mm.',
 'approx.q_r16':'Gięcie R16 jest modelowane jako ostre. Czy to wystarczy?',
 'approx.q_height':'Podaj całkowitą wysokość (H) w mm. Szacunek {H} (z izometrii, brak w OCR).',
 'approx.q_height_ocr':'Podaj całkowitą wysokość (H) w mm. OCR odczytał {read}, z izometrii wynika ok. {H} – czy to {H}?',
 'approx.q_depth':'Podaj całkowitą głębokość (D) w mm. Szacunek {D}.',
 'approx.a.confirm':'Potwierdź','approx.a.reject':'Odrzuć','approx.a.leave_unknown':'Nie wiem',
 'approx.a.change_type':'Zmień typ','approx.a.move':'Przesuń','approx.a.rotate':'Obróć',
 'approx.badge':'PRZYBLIŻONY','approx.p2.pending':'Pozostało pytań: {n}','approx.p2.done':'Wszystkie pytania odpowiedziane'};
function t(k,p){var s=PL[k];if(s==null)return null;return s.replace(/\{(\w+)\}/g,function(_,x){return p&&p[x]!=null?p[x]:'?'})}
var API={PL:PL,t:t,text:function(q){return q&&q.i18n?t(q.i18n,q.params):null}};
root.OriaSGI18nPL=API;if(typeof module!=='undefined'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
