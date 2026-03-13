#!/bin/bash
# UserPromptSubmit 훅: 스킬 평가를 강제하는 프롬프트 주입

SKILLS_DIR="$(cd "$(dirname "$0")/../../.." && pwd)/.agents/skills"
SKILL_LIST=""
if [ -d "$SKILLS_DIR" ]; then
  for skill in "$SKILLS_DIR"/*/; do
    [ -d "$skill" ] && SKILL_LIST="$SKILL_LIST- $(basename "$skill")\n"
  done
fi

cat <<EOF
지시사항: 필수 스킬 활성화 시퀀스

대상 스킬 목록 (.agents/skills/):
$(echo -e "$SKILL_LIST")
1단계 - 평가 (응답에서 수행):
위 대상 스킬 목록의 각 스킬에 대해 다음 형식으로 판단: [스킬명] - YES/NO - [사유]

2단계 - 활성화 (1단계 직후 즉시 수행):
YES인 스킬이 있으면 → 해당 스킬마다 Skill(스킬명) 도구를 호출
모두 NO이면 → "활성화할 스킬 없음"을 명시하고 다음 단계로 진행

3단계 - 구현:
2단계가 완료된 후에만 구현을 시작한다.

중요: 2단계에서 반드시 Skill() 도구를 호출해야 한다. 구현으로 건너뛰지 말 것.
1단계의 평가는 2단계의 활성화 없이는 의미가 없다.

올바른 시퀀스 예시:
- claude-api: NO - Claude API 관련 아님
- vercel-react-best-practices: YES - React 컴포넌트 작성 관련

[이후 즉시 Skill() 도구 호출:]
> Skill(vercel-react-best-practices)

[그 다음에만 구현 시작]
EOF
