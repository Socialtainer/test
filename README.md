# 한국임업진흥원 생성형 AI 실습 가이드

Padlet 강의 보드(실습 1·2, 스킬, 바이브 코딩)를 **단계별 실습 화면**으로 재구성한 정적 웹앱이다.
서버·API·환경변수가 없고, 입력 내용은 브라우저(localStorage)에만 저장된다.

## 구성

- 처음 화면 / 실습 안내(준비물·순서·도구 모음) / 10단계 실습 / 결과 정리(복사·Markdown 저장)
- 단계마다: 목표 → 따라 하기 → 프롬프트 작업칸(복사) → 결과 메모 → 자기 점검 → 회고
- 강사용 진행 보조(하단 토글, **추가 제안** 내용), 가상 샘플 CSV 다운로드(**추가 제안**)

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성
npm run preview  # 빌드 결과 확인
```

## Vercel 배포

1. GitHub 저장소를 Vercel에서 Import 한다. (Framework: Vite, 설정은 `vercel.json`에 포함)
2. 환경변수는 필요 없다. Deploy를 누르면 끝이다.
3. CLI 사용 시: `npm i -g vercel && vercel login && vercel --prod`

## 다른 강의에 재사용하기

콘텐츠는 `src/data/course.js` 한 파일에 모여 있다. 기관명·단계·체크리스트·도구 링크를 바꾸면 화면이 그대로 재구성된다.
샘플 데이터는 `src/data/samples.js`에서 수정한다.

## 자료 반영 범위와 한계

- 보드 PDF의 **썸네일에서 확인된 부분**만 프롬프트·VBA 설명(`excerpt`)에 넣었다.
  프롬프트·VBA 원문은 보드(Padlet Drive)에서 복사해 각 단계의 작업칸에 붙여 넣는 방식이다.
  원문을 `course.js`의 `prompt`에 채워 넣으면 작업칸 기본값으로 쓸 수 있다.
- 보드에 없는 것(r3 단계, 강사용 보조, 샘플 CSV, 도구 대표 URL)은 화면과 코드에 "추가 제안"으로 표시했다.
