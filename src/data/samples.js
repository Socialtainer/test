// 추가 제안: 보드의 가상데이터 이미지를 대체할 수 있는 샘플 (모두 가상 데이터)

const pick = (arr, i) => arr[i % arr.length];

export function receiptsCsv() {
  const head = ['접수번호', '접수일', '접수경로', '유형', '우선순위', '담당부서', '상태'];
  const channels = ['온라인', '전화', '방문', '이메일', '기관공문'];
  const types = ['산림사업 지원 문의', '임업인 교육 신청', '현장 점검 일정 조정', '산림기술 정보 요청', '임산물 유통 상담'];
  const prio = ['높음', '보통', '낮음', '긴급'];
  const depts = ['산림사업지원부', '임업인지원부', '임산물유통지원부', '산림기술협력부'];
  const status = ['접수', '처리중', '완료', '보완요청'];
  const rows = [];
  for (let i = 0; i < 30; i++) {
    const day = String((i % 28) + 1).padStart(2, '0');
    rows.push([
      `KFI-2026-${String(i + 1).padStart(4, '0')}`,
      `2026-07-${day}`,
      pick(channels, i * 3 + 1),
      pick(types, i * 2 + 1),
      pick(prio, i * 5 + 2),
      pick(depts, i * 7 + 3),
      pick(status, i * 11 + 2),
    ]);
  }
  return [head, ...rows];
}

export function piiCsv() {
  const head = ['번호', '이름', '성별', '생년월일', '연락처', '이메일'];
  const family = ['김', '이', '박', '최', '정', '강', '조', '윤'];
  const given = ['민수', '서연', '지훈', '하윤', '도현', '수아', '준서', '예린'];
  const rows = [];
  for (let i = 0; i < 40; i++) {
    const y = 1970 + ((i * 7) % 35);
    const m = String((i % 12) + 1).padStart(2, '0');
    const d = String(((i * 3) % 28) + 1).padStart(2, '0');
    rows.push([
      i + 1,
      pick(family, i * 3 + 1) + pick(given, i * 5 + 2),
      i % 2 ? '여' : '남',
      `${y}-${m}-${d}`,
      `010-0000-${String(1000 + i * 37).slice(-4)}`,
      `sample${i + 1}@example.com`,
    ]);
  }
  return [head, ...rows];
}

export const samples = {
  receipts: { label: '접수현황 샘플 데이터(가상)', file: 'receipts_sample.csv', build: receiptsCsv },
  pii: { label: '개인정보 마스킹 샘플(가상)', file: 'pii_sample.csv', build: piiCsv },
};

export function toCsv(rows) {
  return rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
}
