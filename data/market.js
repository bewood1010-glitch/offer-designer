/* Monthly-updated market data. Edited by the scheduled update routine; keep valid JSON after the "=" sign. */
window.OD_MARKET = {
 "schema": 1,
 "updatedAt": "2026-10-09",
 "nextUpdate": "2026-11-01",
 "fx": {
  "usdkrw": 1390,
  "asOf": "2026-10-09",
  "note": "리서치 기준 환율(시장 약 1,377원, 2026-09-16)"
 },
 "minWage": {
  "year": 2026,
  "hourly": 10320,
  "nextYear": 2027,
  "nextHourly": 10700,
  "monthlyHours": 209
 },
 "insurance": {
  "year": 2026,
  "pension": 4.75,
  "health": 3.595,
  "ltcOfHealth": 13.14,
  "employment": 0.9,
  "pensionCapMonthly": 6590000,
  "pensionCapFrom": "2026-07-01",
  "sources": [
   "https://www.shoplworks.com/blog-insight/2026-four-major-insurance-rate-changes-company-must-know",
   "https://asiatop.co.kr/insurance-labor/four-insurance-rate-2026-summary/"
  ]
 },
 "market": [
  {
   "lo": 0,
   "hi": 2,
   "p25": 39000000,
   "p50": 44000000,
   "p75": 49000000,
   "ttc25": 46000000,
   "ttc": 52000000,
   "ttc75": 58000000
  },
  {
   "lo": 3,
   "hi": 5,
   "p25": 46000000,
   "p50": 51000000,
   "p75": 56000000,
   "ttc25": 55000000,
   "ttc": 61000000,
   "ttc75": 67000000
  },
  {
   "lo": 6,
   "hi": 9,
   "p25": 53000000,
   "p50": 59000000,
   "p75": 66000000,
   "ttc25": 63000000,
   "ttc": 70000000,
   "ttc75": 78000000
  },
  {
   "lo": 10,
   "hi": 14,
   "p25": 62000000,
   "p50": 69000000,
   "p75": 77000000,
   "ttc25": 73000000,
   "ttc": 81000000,
   "ttc75": 90000000
  },
  {
   "lo": 15,
   "hi": 30,
   "p25": 70000000,
   "p50": 78000000,
   "p75": 88000000,
   "ttc25": 83000000,
   "ttc": 92000000,
   "ttc75": 103000000
  }
 ],
 "notes": {
  "ko": "<h2>시장 조사 요약 (2026-10-09 기준)</h2>\n<p class=\"hint\">신뢰도 표기 — <b>[공식]</b> 정부통계·공시 · <b>[공고]</b> 채용공고 공개범위 · <b>[연금]</b> 국민연금 역산 · <b>[크라우드]</b> 블라인드·잡플래닛·Glassdoor 자기보고 · <b>[언론]</b> 보도 · <b>[추정]</b> 본 조사 추정치. 금액 단위: 만원(연, 세전) — 별도 표기 제외.</p>\n\n<h3>1. 핵심 메시지</h3>\n<ol>\n<li><b>외국계 장비사 엔지니어의 전형:</b> 계약연봉 중앙값 <b>4,900~6,200</b> + 보너스 중앙값 <b>1,000~1,500</b> + 수당. 리페어 직무는 교대·출장이 적어 이 범위의 하단~중간에 위치합니다. [크라우드]</li>\n<li><b>신입 초봉:</b> 외국계 장비사 학사 CE 4,700~5,300(ASML 학사 기본급 4,800, AMK 4,761, TEL 4,720). 반면 <b>국내 협력사·리페어 중소업체는 3,000~4,000</b>으로 1,000~1,500 낮습니다. [언론][공고]</li>\n<li><b>후보자 기대 인상률:</b> 이직 고려 최소 인상률 평균 <b>11.8%</b>(잡코리아, 1,088명), 실무 통념 10~15%. 연례 인상(외국계 3~5%, 2026 한국 예산 4.0%)과의 격차가 이직 동기입니다. [조사]</li>\n<li><b>칩메이커와의 총액 경쟁은 불가:</b> SK하이닉스 2026 PS = 기본급의 2,964%(연봉 1억 → PS 1.48억), 삼성 2026 인상 6.2%. 삼성·SK 출신에게는 총액이 아닌 일근·커리어·고정급 안정성·사이닝/리텐션으로 대응해야 합니다. [언론]</li>\n<li><b>최저임금:</b> 2026 시급 10,320원(월 2,156,880원, 연 2,588만원), <b>2027 시급 10,700원</b>(연 약 2,684만원). 내부 Grade 밴드의 Min이 두 기준을 연으로 환산한 금액 이상인지 점검하세요. [공식]</li>\n</ol>\n\n<h3>2. 한국 — 외국계 반도체 장비사 보상 수준</h3>\n<div class=\"tbl-wrap\"><table>\n<tr><th class=\"l\">회사</th><th>블라인드 계약연봉 중앙값</th><th>블라인드 보너스 중앙값</th><th>잡플래닛 평균 [연금]</th><th>사람인 평균 (성과급 포함 추정)</th></tr>\n<tr><td class=\"l\">KLA코리아</td><td>6,249</td><td>1,509</td><td>7,836*</td><td>10,025</td></tr>\n<tr><td class=\"l\">한국램리서치 / 램리서치코리아</td><td>5,800 / 5,565</td><td>1,299 / 1,203</td><td>7,423</td><td>9,806</td></tr>\n<tr><td class=\"l\">ASML코리아</td><td>5,756</td><td>1,500</td><td>7,862*</td><td>10,388</td></tr>\n<tr><td class=\"l\">아드반테스트코리아</td><td>5,447</td><td>1,300</td><td>7,083</td><td>—</td></tr>\n<tr><td class=\"l\">어플라이드머티어리얼즈코리아</td><td>5,300</td><td>1,003</td><td>—</td><td>10,048</td></tr>\n<tr><td class=\"l\">엠케이에스코리아(MKS)</td><td>5,125</td><td>1,077</td><td>—</td><td>—</td></tr>\n<tr><td class=\"l\">에드워드코리아</td><td>5,000</td><td>600</td><td>—</td><td>—</td></tr>\n<tr><td class=\"l\">도쿄일렉트론코리아</td><td>4,857</td><td>1,509</td><td>7,399</td><td>10,014</td></tr>\n<tr><th class=\"l\" colspan=\"5\" style=\"text-align:left\">비교군</th></tr>\n<tr><td class=\"l\">세메스</td><td>6,000</td><td>1,800</td><td>7,927*</td><td>10,403</td></tr>\n<tr><td class=\"l\">원익IPS / 피에스케이 / 주성</td><td>5,203 / 5,113 / 5,125</td><td>1,000 내외</td><td>6,924 / 6,628 / —</td><td>8,561 / 9,056 / 7,181</td></tr>\n<tr><td class=\"l\">코미코 (부품 세정·코팅·리페어)</td><td>4,538</td><td>550</td><td>6,135</td><td>6,237</td></tr>\n<tr><td class=\"l\">국내 협력사 리페어·셋업 공고 (2026)</td><td colspan=\"4\">연 3,000~4,000 (Tier-0 설치 경력 4,000+) [공고]</td></tr>\n<tr><td class=\"l\">삼성전자 / SK하이닉스 (전사 평균, 2025 사업보고서)</td><td>6,654 / 6,058</td><td>3,000 / 3,000</td><td colspan=\"2\">1억5,800 / 1억8,500 [공식]</td></tr>\n</table></div>\n<p class=\"hint\">* 국민연금 기준소득월액 상한(637만→659만원, 연 7,644~7,908만원)에 걸려 실제보다 과소추정된 값입니다. 후보자에게 '시장 평균'으로 제시하지 마세요. 블라인드 표본 수는 비공개, 2026-10-09 조회.</p>\n\n<h3>3. 시장 기준표 도출 근거 [추정]</h3>\n<ul>\n<li>0~2년: 외국계 학사 초봉 4,700~5,300 → 리페어는 전문학사 채용이 많아 P50 4,400, P25 3,900(협력사 상단보다 약간 위)</li>\n<li>6~9년: 잡플래닛 7~8년차 입력값(TEL 5,921, 램 5,526~5,903, AMK 5,871) + 블라인드 중앙값 → P50 5,900</li>\n<li>연차 간 P50 +12~17% (연례 3~5% + 승진 효과), 총현금 = 계약연봉 + 목표보너스 12~15% + 수당·OT 200~400</li>\n<li>보정: 교대 FSE/CS(ASML형) 총현금 +20~40%, 출장 잦은 FSE/셋업 +5~15%, 국내 협력사는 표의 70~85%</li>\n<li>공식 통계 교차점검: 고용24 직업정보 전자계측제어기술자 중위 4,600 / 반도체공학 기술자 중위 8,000 사이 [공식]</li>\n</ul>\n\n<h3>4. 수당 · 인센티브 · 복리후생</h3>\n<div class=\"tbl-wrap\"><table>\n<tr><th class=\"l\">구분</th><th class=\"l\">한국 외국계 장비사</th><th class=\"l\">글로벌</th></tr>\n<tr><td class=\"l\">교대/On-call</td><td class=\"l\">교대는 ASML CS만(교대 시 총액 1억 전후), 그 외 On-call 중심. ASML 원격지 '오지수당' [크라우드]</td><td class=\"l\">ASML 야간 15% 가산, 미국 FSE는 시급제로 OT 1.5배 [공고]</td></tr>\n<tr><td class=\"l\">기타 수당</td><td class=\"l\">식대 비과세 월 20만원, ASML 대중교통 일 최대 2만원, 히타치 엔지니어수당·주거지원·자격 인센티브 [공고][언론]</td><td class=\"l\">미국 출장 per diem 일 $178(연방 기준) [공식]</td></tr>\n<tr><td class=\"l\">연간 보너스</td><td class=\"l\">램 AIP 계약연봉의 15~20%, 외국계 신입 PI 10% 사례 [크라우드]</td><td class=\"l\">미국 FSE 기본급의 약 5~10% [크라우드]</td></tr>\n<tr><td class=\"l\">주식</td><td class=\"l\">ASML코리아 기본급 15% 자사주 특별보너스(3년 분할), ASML 글로벌 €20,000 리텐션 주식(2030년까지 재직 조건) [언론]</td><td class=\"l\">ESPP 15% 할인(AMAT·Lam·KLA), ASML 12개월 보유 시 20% 현금 보너스 [공식]</td></tr>\n<tr><td class=\"l\">복리후생</td><td class=\"l\">복지포인트(신입 사례 150만원), 자녀 학자금, 사택(TEL), 연차 25일(히타치), 사내 어린이집(ASML) [공고][크라우드]</td><td class=\"l\">401(k) 매칭 AMAT 4.5% / Lam 3% / KLA 2.5% [공식][크라우드]</td></tr>\n</table></div>\n\n<h3>5. 글로벌 비교 (참고, 1 USD = 1,390원)</h3>\n<div class=\"tbl-wrap\"><table>\n<tr><th class=\"l\">지표</th><th>현지 금액</th><th>원화 환산</th><th class=\"l\">근거</th></tr>\n<tr><td class=\"l\">미국 BLS 49-2094 전기전자장비 수리원 P25/P50/P75</td><td>$60.0K / $74.1K / $88.7K</td><td>8,300 / 10,300 / 12,300</td><td class=\"l\">[공식] OEWS May 2025</td></tr>\n<tr><td class=\"l\">같은 직무 · 기계제조업(NAICS 333) P50/P75</td><td>$90.9K / $122.9K</td><td>12,600 / 17,100</td><td class=\"l\">[공식]</td></tr>\n<tr><td class=\"l\">AMAT FSE C2(초급) / C3(중급) 공고 범위</td><td>$31.0–42.4/h / $37.0–51.2/h</td><td>9,000–12,300 / 10,700–14,800</td><td class=\"l\">[공고] 2026</td></tr>\n<tr><td class=\"l\">부품 수리 전문사 (AE·MKS·Edwards) 테크니션</td><td>$24.5–40/h</td><td>7,100–11,600</td><td class=\"l\">[공고] OEM 대비 15~30% 낮음</td></tr>\n<tr><td class=\"l\">대만 AMAT CE 연봉</td><td>NT$1.0–1.3M</td><td>4,500–5,900</td><td class=\"l\">[크라우드]</td></tr>\n<tr><td class=\"l\">싱가포르 FSE (월×13+보너스)</td><td>SGD 70–110K</td><td>7,600–11,900</td><td class=\"l\">[추정]</td></tr>\n<tr><td class=\"l\">일본 30대 FE</td><td>¥6.5–9.0M</td><td>6,000–8,400</td><td class=\"l\">[추정] TEL 유가증권보고서 평균 ¥13.5M(전사)</td></tr>\n<tr><td class=\"l\">2027 임금인상 예산</td><td colspan=\"3\" class=\"l\">미국 3.4~3.5% (High-tech merit 3.8%), 대만·싱가포르 4.0%, 한국 2026 4.0%, 외국계 한국법인 2025 대부분 3~5% [조사]</td></tr>\n</table></div>\n<p class=\"hint\">해외 수치는 생계비·세제·OT 구조가 달라 직접 비교용이 아니라 '글로벌 본사 설득용' 참고자료입니다. 한국 리페어 엔지니어 중위 총현금(6~9년차 약 7,000)은 미국 동일 직무의 약 55~65% 수준입니다.</p>\n\n<h3>6. 오퍼 이탈 방지 제언</h3>\n<ol>\n<li><b>연봉 범위를 1차 면접 전에 공유</b>하세요. 오퍼 단계에서 처음 금액을 듣고 이탈하는 구조 자체가 문제입니다.</li>\n<li><b>총보상(Total Rewards) 명세서</b>로 제시: 기본급 + 목표보너스 + 수당 + ESPP/주식 + 복리후생 환산액. (앱의 '후보자용 보상 요약' 탭)</li>\n<li><b>출신별 메시지 차별화</b> — 협력사 출신: 시장 3,000~4,000 대비 +20~40%임을 수치로 / 장비사 출신: 교대·OT를 제외한 시간당 임금 비교 / 칩메이커 출신: 고정급 안정성·커리어·사이닝.</li>\n<li><b>밴드 초과분은 사이닝 보너스로</b> 보전해 고정비와 내부 형평성(PIR 역전)을 지키세요.</li>\n<li><b>국민연금 기반 평균을 근거로 쓰지 마세요</b>(상한 절단). 블라인드 계약연봉 중앙값과 공고 범위가 후보자 체감과 가깝습니다.</li>\n<li><b>내부 밴드 점검</b>: 밴드 Min이 최저임금 연 환산보다 낮거나, Max가 목표 경력대 시장 중위보다 낮으면 경력자 채용에서 구조적으로 이탈이 발생합니다.</li>\n<li><b>비포괄(OT 실비 지급)</b>은 2026-04-09 포괄임금 지도지침 시행 이후 차별점으로 소구할 수 있습니다.</li>\n</ol>\n\n<h3>7. 데이터 한계</h3>\n<ul>\n<li>외국계 한국법인의 직급·연차별 공식 테이블은 공개 자료가 없어, 경력별 시장 기준표는 회사 단위 데이터로 만든 <b>추정치</b>입니다.</li>\n<li>크라우드 데이터는 표본편향(주니어 비중) 가능성이 있습니다. 정밀 벤치마킹이 필요하면 Radford(Aon) Global Technology Survey, Mercer TRS, WTW의 반도체 장비 peer 데이터 구매를 권장합니다.</li>\n<li>회사별 식대·교대수당 금액, 한국법인 ESPP 적용 여부는 확인하지 못했습니다.</li>\n</ul>\n<p class=\"src\">주요 출처: 잡플래닛·블라인드·사람인 회사별 연봉 페이지(2026-10-09 조회), BLS OEWS May 2025, Applied Materials/KLA/ASML/Lam 채용공고, SEC 10-K·20-F, 노컷뉴스 2026-07-22, 한국경제 2026-10-04, 헤럴드경제 2026-05-16, 잡코리아 2025-08 설문, 최저임금위원회 2026-07 의결. 상세 URL은 동봉된 조사 보고서(reports 폴더)에 있습니다.</p>",
  "en": "<h2>Market research summary (as of 2026-10-09)</h2>\n<p class=\"hint\">Reliability tags — <b>[Official]</b> government stats / filings · <b>[Posting]</b> posted pay ranges · <b>[Pension]</b> derived from National Pension data · <b>[Crowd]</b> Blind/Jobplanet/Glassdoor self-reports · <b>[Press]</b> · <b>[Est.]</b> our estimate. Amounts in KRW 10,000 (만원), annual, pre-tax unless noted.</p>\n\n<h3>1. Key messages</h3>\n<ol>\n<li><b>Typical foreign equipment-maker engineer in Korea:</b> contract salary median <b>49–62M KRW</b> + bonus median <b>10–15M</b> + allowances. Repair roles (little shift/travel) sit in the lower-to-middle part of this range. [Crowd]</li>\n<li><b>Starting pay:</b> 47–53M at foreign vendors (ASML bachelor base 48M, AMK 47.6M, TEL 47.2M) vs <b>30–40M at Korean subcontractors / repair SMEs</b>. [Press][Posting]</li>\n<li><b>Candidate expectations:</b> minimum raise to consider moving averages <b>11.8%</b> (JobKorea, n=1,088); 10–15% in practice, vs. 3–5% annual raises at foreign firms (Korea 2026 budget 4.0%).</li>\n<li><b>Chipmakers cannot be matched on total cash:</b> SK hynix 2026 profit sharing = 2,964% of monthly base (≈148M KRW on a 100M salary); Samsung 2026 raise 6.2%. Compete on day-shift, career, fixed-pay stability, sign-on/retention instead. [Press]</li>\n<li><b>Minimum wage:</b> 2026 KRW 10,320/h (25.9M/yr); <b>2027 KRW 10,700/h</b> (~26.8M/yr). Check that every internal grade minimum is at or above the annualized minimum wage. [Official]</li>\n</ol>\n\n<h3>2. Korea — pay at foreign semiconductor equipment firms (KRW 10,000)</h3>\n<div class=\"tbl-wrap\"><table>\n<tr><th class=\"l\">Company</th><th>Blind contract median</th><th>Blind bonus median</th><th>Jobplanet avg [Pension]</th><th>Saramin avg (incl. bonus, est.)</th></tr>\n<tr><td class=\"l\">KLA Korea</td><td>6,249</td><td>1,509</td><td>7,836*</td><td>10,025</td></tr>\n<tr><td class=\"l\">Lam Research Korea entities</td><td>5,565–5,800</td><td>1,203–1,299</td><td>7,423</td><td>9,806</td></tr>\n<tr><td class=\"l\">ASML Korea</td><td>5,756</td><td>1,500</td><td>7,862*</td><td>10,388</td></tr>\n<tr><td class=\"l\">Advantest Korea</td><td>5,447</td><td>1,300</td><td>7,083</td><td>—</td></tr>\n<tr><td class=\"l\">Applied Materials Korea</td><td>5,300</td><td>1,003</td><td>—</td><td>10,048</td></tr>\n<tr><td class=\"l\">MKS Korea</td><td>5,125</td><td>1,077</td><td>—</td><td>—</td></tr>\n<tr><td class=\"l\">Edwards Korea</td><td>5,000</td><td>600</td><td>—</td><td>—</td></tr>\n<tr><td class=\"l\">Tokyo Electron Korea</td><td>4,857</td><td>1,509</td><td>7,399</td><td>10,014</td></tr>\n<tr><td class=\"l\">Comparators: SEMES / Wonik IPS / PSK</td><td>6,000 / 5,203 / 5,113</td><td>1,800 / ~1,000</td><td>7,927* / 6,924 / 6,628</td><td>10,403 / 8,561 / 9,056</td></tr>\n<tr><td class=\"l\">KoMiCo (parts cleaning/coating/repair)</td><td>4,538</td><td>550</td><td>6,135</td><td>6,237</td></tr>\n<tr><td class=\"l\">Korean subcontractor repair/setup postings 2026</td><td colspan=\"4\">3,000–4,000 [Posting]</td></tr>\n<tr><td class=\"l\">Samsung / SK hynix (company avg, 2025 filings)</td><td>6,654 / 6,058</td><td>3,000 / 3,000</td><td colspan=\"2\">15,800 / 18,500 [Official]</td></tr>\n</table></div>\n<p class=\"hint\">* Capped by the National Pension contribution ceiling (annualized 76.4–79.1M) — understates real pay. Do not present to candidates as \"market average\".</p>\n\n<h3>3. Basis of the market reference table [Est.]</h3>\n<ul>\n<li>0–2 yrs anchored on foreign-vendor starting pay (47–53M), adjusted down for associate-degree repair hires → P50 44M.</li>\n<li>6–9 yrs anchored on Jobplanet 7–8-year inputs (TEL 59.2M, Lam 55–59M, AMK 58.7M) and Blind medians → P50 59M.</li>\n<li>P50 steps +12–17% per band; total cash = contract salary + 12–15% target bonus + 2–4M allowances/OT.</li>\n<li>Adjust: shift FSE/CS +20–40% total cash; heavy-travel FSE/setup +5–15%; Korean subcontractors 70–85% of table.</li>\n</ul>\n\n<h3>4. Allowances · incentives · benefits</h3>\n<ul>\n<li>Shift work only at ASML CS (~100M total with shifts); others on-call. ASML US night shift +15%; US FSEs hourly with 1.5× OT.</li>\n<li>Annual bonus: Lam AIP 15–20% of contract salary (Korea, crowd); US FSE ~5–10% of base.</li>\n<li>Equity: ASML Korea 15%-of-base stock special bonus over 3 yrs; ASML global €20,000 retention shares (stay until 2030); ESPP 15% discount at AMAT/Lam/KLA.</li>\n<li>Benefits: flexible points (~1.5M), child tuition, company housing (TEL), 25 days leave (Hitachi High-Tech), on-site daycare (ASML); US 401(k) match 2.5–4.5%.</li>\n</ul>\n\n<h3>5. Global comparison (1 USD = 1,390 KRW)</h3>\n<ul>\n<li>US BLS 49-2094 (electrical/electronics repairers, commercial/industrial) P25/P50/P75: $60.0K / $74.1K / $88.7K; in machinery manufacturing P50 $90.9K, P75 $122.9K. [Official]</li>\n<li>AMAT FSE C2 $31.0–42.4/h, C3 $37.0–51.2/h (Santa Clara $42.5–58.9/h); ASML FSE $37–51/h; parts-repair specialists 15–30% lower. [Posting]</li>\n<li>Taiwan NT$1.0–1.3M; Singapore SGD 70–110K; Japan 30s FE ¥6.5–9.0M; 2027 budgets: US 3.4–3.5% (high-tech 3.8%), TW/SG 4.0%.</li>\n<li>Korean repair engineer mid-career total cash (~70M) ≈ 55–65% of the US equivalent.</li>\n</ul>\n\n<h3>6. Recommendations to reduce offer drop-outs</h3>\n<ol>\n<li>Share the pay range before/at the first interview — not at offer stage.</li>\n<li>Present a Total Rewards statement (base + target bonus + allowances + ESPP/equity + benefits).</li>\n<li>Tailor the message by source: subcontractor (+20–40% vs. 30–40M market), equipment vendor (compare hourly pay excl. shift/OT), chipmaker (stability, career, sign-on).</li>\n<li>Bridge above-range gaps with one-time sign-on bonuses to protect fixed cost and internal equity.</li>\n<li>Review internal ranges: a minimum below the annualized minimum wage, or a maximum below the target market median, causes structural drop-outs.</li>\n</ol>\n<p class=\"src\">Detailed source URLs are in the bundled research reports (reports folder).</p>"
 },
 "changelog": [
  {
   "date": "2026-10-09",
   "ko": "최초 작성: 한국·글로벌 시장 조사 반영, 2026 4대보험 요율, 2026/2027 최저임금",
   "en": "Initial release: Korea & global research, 2026 social insurance rates, 2026/2027 minimum wage"
  }
 ]
};
