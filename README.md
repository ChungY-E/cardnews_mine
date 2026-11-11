# PDF 쉬운 해설 & 카드뉴스 생성기

정적 HTML, 바닐라 JS, Vercel 서버리스 함수 1개로 구성된 PDF 분석 앱입니다.

## 저장소 구조

```text
api/analyze.js
public/index.html
public/app.js
vercel.json
package.json
.gitignore
.env.example
README.md
```

GitHub 저장소 **최상위**에 위 파일과 디렉터리를 배치하세요. `pdf-cardnews/` 폴더를 한 겹 더 넣지 마세요.

## 배포

1. 파일을 GitHub 저장소 루트에 커밋하고 푸시합니다.
2. Vercel에서 **Add New → Project → Import Git Repository**를 선택합니다.
3. **Framework Preset: Other**, **Root Directory: `./`**로 설정합니다. Output Directory는 `vercel.json`의 `public`을 사용합니다.
4. **Settings → Environment Variables**에 `GEMINI_API_KEY`를 등록합니다.
5. 외부 공개 시 `ACCESS_CODE`를 설정하는 것을 권장합니다. 선택적으로 `GEMINI_MODEL`, `THINKING_LEVEL`을 지정할 수 있습니다.
6. 배포하고 PDF로 테스트합니다. 환경변수를 바꿨으면 반드시 **Redeploy**합니다. 코드 커밋은 자동 배포를 트리거합니다.

## 환경 변수

| 변수 | 필수 | 기본값 |
|---|---|---|
| `GEMINI_API_KEY` | 예 | 없음 |
| `ACCESS_CODE` | 아니오 | 없음 (누구나 호출 가능) |
| `GEMINI_MODEL` | 아니오 | `gemini-3.8-flash` |
| `THINKING_LEVEL` | 아니오 | 미설정 |

`THINKING_LEVEL` 지원값은 모델별로 다릅니다. 400 오류가 발생하면 변수 삭제 후 재배포하세요. 사용하는 모델 ID는 Google Gemini 공식 모델 문서에서 확인하세요.

## 작동 방식 및 보안

- 브라우저 → `/api/analyze`: `application/octet-stream` PDF **원본 바이트**, 최대 4MiB.
- 서버 → Gemini REST API: PDF를 Base64 `inlineData`로 전달하고 한국어 JSON을 요청합니다.
- `GEMINI_API_KEY`는 서버 환경변수에만 보관하며, 브라우저로 전달하지 않습니다.
- AI 결과는 `textContent`로만 표시합니다. 파일과 결과는 저장하지 않습니다.
- `ACCESS_CODE`는 개인적 접근 제한용이며 완전한 사용자 인증이나 속도 제한을 대체하지 않습니다.

## 알려진 제약

- 배포 환경의 함수 `maxDuration: 300` 설정이 허용되지 않으면 120 또는 60으로 변경해야 하지만, 코드의 Gemini 요청 타임아웃 270초보다 짧으면 플랫폼에서 먼저 종료할 수 있습니다. 실제 사용 가능한 실행 시간 및 모델 호출 시간을 확인해 조정하세요.
- Gemini API 모델 ID, 사용 가능 여부, 요청 제한, 무료 할당량은 계정/시기에 따라 달라질 수 있습니다.
- Tailwind CDN은 프로토타입 용도입니다. Pretendard도 외부 CDN에서 로드합니다.
- Vercel Hobby는 개인·비상업 목적의 사용 조건을 확인하세요.
- 로컬 자동 검사는 API를 모의 호출해 수행하며 실제 Gemini 분석과 Vercel 배포 결과를 보증하지 않습니다.
