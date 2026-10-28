@AGENTS.md

## 작업 규칙

- 코드를 수정할 때마다 바로 커밋하고 `claude/awesome-rubin-fruhui` 브랜치에 푸시한다.
  Vercel이 이 브랜치를 배포하므로, 푸시해야 변경사항이 배포 사이트에 반영된다.
- 푸시 전에 `npm run lint`와 `npm run build`가 통과하는지 확인한다. 실패하면 고친 뒤 푸시한다.
- 커밋 메시지는 무엇을 왜 바꿨는지 알 수 있게 쓴다.
