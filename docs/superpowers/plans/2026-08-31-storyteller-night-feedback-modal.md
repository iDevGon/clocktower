# Storyteller Night Feedback Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present night-role feedback in a distinct, readable modal with large controls and trustworthy recommendation emphasis.

**Architecture:** Keep `NightFeedbackPanel` responsible for target sequencing and server callbacks, extract recommendation derivation into a pure helper, and render the approved angular modal shell through React Native `Modal`. Extend existing feedback controls only with the suggestion data they need; do not create a second feedback system.

**Tech Stack:** TypeScript, React Native, Expo, shared Clocktower role state, Vitest.

---

## Approved visual direction

- Centered modal with a dimmed backdrop.
- Angular 2–3px corners and team-colored border.
- Korean-only header: role name, target name, target progress.
- Ability text, adjudication evidence, recommendation banner, large choices, then send action.
- Gold gradient/glow and a `추천` label for deterministic recommendations.
- No real-value recommendation when the ability is drunk, poisoned, or otherwise malfunctioning.

## File map

- `apps/storyteller/src/components/nightFeedbackSuggestion.ts`: pure recommendation model.
- `apps/storyteller/src/components/NightFeedbackPanel.tsx`: modal shell, evidence, target progression, callback handling.
- `apps/storyteller/src/components/NightFeedbackPanel.styles.ts`: approved angular visual system.
- `apps/storyteller/src/components/FeedbackComposer.tsx`: route suggestion values to controls.
- `apps/storyteller/src/components/feedback/NumberFeedback.tsx`: large recommended number choices.
- `apps/storyteller/src/components/feedback/YesNoFeedback.tsx`: recommended yes/no choice.
- `apps/storyteller/src/components/feedback/RoleFeedback.tsx`: recommended role choice.
- `apps/storyteller/src/components/NightPanel.tsx`: open/collapse/resume integration.

### Task 1: Model deterministic recommendations

**Files:**
- Create: `apps/storyteller/src/components/nightFeedbackSuggestion.ts`
- Create: `apps/storyteller/src/components/__tests__/nightFeedbackSuggestion.test.ts`

- [ ] **Step 1: Write failing recommendation tests**

Define cases for number, yes/no, role, and malfunctioning states:

```ts
expect(
  getNightFeedbackSuggestion({
    roleId: 'empath',
    isMalfunctioning: false,
    empathEvilCount: 1,
  }),
).toEqual({ type: 'number', value: 1, reason: '악한 이웃 1명' });

expect(
  getNightFeedbackSuggestion({
    roleId: 'fortune_teller',
    isMalfunctioning: false,
    fortuneTellerResult: true,
  }),
).toEqual({ type: 'yes_no', value: true, reason: '악마 또는 붉은 청어 감지' });

expect(
  getNightFeedbackSuggestion({
    roleId: 'undertaker',
    isMalfunctioning: false,
    revealedRoleName: '임프',
  }),
).toEqual({ type: 'role', roleName: '임프', reason: '어젯밤 처형된 역할' });

expect(
  getNightFeedbackSuggestion({
    roleId: 'empath',
    isMalfunctioning: true,
    empathEvilCount: 1,
  }),
).toBeNull();
```

Add equivalent deterministic cases for Chef, Ravenkeeper, and Juggler.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/storyteller test -- nightFeedbackSuggestion.test.ts`

- [ ] **Step 3: Implement a discriminated suggestion union**

```ts
export type NightFeedbackSuggestion =
  | { type: 'number'; value: number; reason: string }
  | { type: 'yes_no'; value: boolean; reason: string }
  | { type: 'role'; roleName: string; reason: string };
```

Return `null` first when `isMalfunctioning` is true. Then derive only values already supported by server action data or storyteller-only hints: Empath, Chef, Juggler, Fortune Teller, Undertaker, and Ravenkeeper. Unknown or incomplete inputs return `null`.

- [ ] **Step 4: Verify and commit**

Run the focused test.

```bash
git add apps/storyteller/src/components/nightFeedbackSuggestion.ts apps/storyteller/src/components/__tests__/nightFeedbackSuggestion.test.ts
git commit -m "feat: derive trustworthy night feedback suggestions"
```

### Task 2: Add the angular modal shell

**Files:**
- Modify: `apps/storyteller/src/components/NightFeedbackPanel.tsx`
- Modify: `apps/storyteller/src/components/NightFeedbackPanel.styles.ts`
- Create: `apps/storyteller/src/components/__tests__/nightFeedbackModalSource.test.ts`
- Modify: `apps/storyteller/src/components/__tests__/nightFeedbackCallbackSource.test.ts`

- [ ] **Step 1: Write failing modal source tests**

```ts
expect(source).toContain("import { Modal");
expect(source).toContain('animationType="fade"');
expect(source).toContain('피드백 접기');
expect(source).toContain('현재 추천 피드백');
expect(source).not.toContain('Night feedback');
expect(styleSource).toContain('borderRadius: 3');
```

Keep the existing assertion that completion changes only inside the successful server callback.

- [ ] **Step 2: Verify red**

Run the two feedback source tests.

- [ ] **Step 3: Render the modal without changing target sequencing**

Add `visible: boolean` and `onCollapse: () => void` props. Wrap the existing target content in:

```tsx
<Modal
  visible={visible}
  transparent
  animationType="fade"
  onRequestClose={onCollapse}
>
  <View style={modalStyles.backdrop}>
    <View style={[modalStyles.modal, { borderColor: cardColors.color }]}> 
      <View style={modalStyles.header}>
        <View>
          <Text style={modalStyles.title}>{role?.name ?? activeRoleId}</Text>
          <Text style={modalStyles.target}>
            {targetPlayer.name}에게 전달 {progressLabel}
          </Text>
        </View>
        <Pressable onPress={onCollapse} accessibilityLabel="피드백 접기">
          <Text style={modalStyles.collapseText}>접기</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={modalStyles.content}>
        {content}
      </ScrollView>
    </View>
  </View>
</Modal>
```

Use 2–3px radii on modal, recommendation banner, choices, and send buttons. Keep role team colors and existing malfunction warnings.

- [ ] **Step 4: Preserve state while collapsed**

Do not unmount or reset `sentIndices` when `visible` becomes false. Reset only when `activeRoleId` changes. `NightPanel` continues to own `feedbackCollapsed` and can reopen through the existing floating timer control.

- [ ] **Step 5: Verify and commit**

Run storyteller feedback tests and typecheck.

```bash
git add apps/storyteller/src/components/NightFeedbackPanel.tsx apps/storyteller/src/components/NightFeedbackPanel.styles.ts apps/storyteller/src/components/__tests__/nightFeedbackModalSource.test.ts apps/storyteller/src/components/__tests__/nightFeedbackCallbackSource.test.ts
git commit -m "feat: present night feedback in an angular modal"
```

### Task 3: Highlight recommendations in large feedback controls

**Files:**
- Modify: `apps/storyteller/src/components/FeedbackComposer.tsx`
- Modify: `apps/storyteller/src/components/feedback/NumberFeedback.tsx`
- Modify: `apps/storyteller/src/components/feedback/YesNoFeedback.tsx`
- Modify: `apps/storyteller/src/components/feedback/RoleFeedback.tsx`
- Modify: `apps/storyteller/src/components/NightActionLog.styles.ts`
- Create: `apps/storyteller/src/components/__tests__/feedbackSuggestionControlsSource.test.ts`

- [ ] **Step 1: Write failing source tests for all supported choice types**

Assert `FeedbackComposer` accepts `suggestion`, routes number/yes-no/role values, and each control renders `추천` only for the matching choice. Assert each action style has at least 52px scaled minimum height.

- [ ] **Step 2: Verify red**

Run: `pnpm --filter @clocktower/storyteller test -- feedbackSuggestionControlsSource.test.ts`

- [ ] **Step 3: Route the typed suggestion**

Add `suggestion?: NightFeedbackSuggestion | null` to `FeedbackComposerProps`. Pass:

```tsx
<NumberFeedback
  suggestedNumber={suggestion?.type === 'number' ? suggestion.value : undefined}
  maxNumber={maxNumber}
  onSend={onSend}
/>
<YesNoFeedback
  suggestedValue={suggestion?.type === 'yes_no' ? suggestion.value : undefined}
  onSend={onSend}
/>
<RoleFeedback
  highlightedRoleName={
    suggestion?.type === 'role' ? suggestion.roleName : undefined
  }
  players={players}
  onSend={onSend}
/>
```

- [ ] **Step 4: Apply the approved emphasis**

Increase choice and send touch targets, apply gold border/background/shadow to the matching suggestion, add a visible `추천` label, and reduce emphasis on alternatives without disabling them. Add accessibility labels such as `1, 추천 피드백` and `예, 추천 피드백`.

- [ ] **Step 5: Verify and commit**

Run storyteller tests/typecheck.

```bash
git add apps/storyteller/src/components/FeedbackComposer.tsx apps/storyteller/src/components/feedback/NumberFeedback.tsx apps/storyteller/src/components/feedback/YesNoFeedback.tsx apps/storyteller/src/components/feedback/RoleFeedback.tsx apps/storyteller/src/components/NightActionLog.styles.ts apps/storyteller/src/components/__tests__/feedbackSuggestionControlsSource.test.ts
git commit -m "feat: highlight recommended night feedback"
```

### Task 4: Integrate role evidence and recommendation payloads

**Files:**
- Modify: `apps/storyteller/src/components/NightFeedbackPanel.tsx`
- Modify: `apps/storyteller/src/components/NightPanel.tsx`
- Modify: `apps/storyteller/src/components/__tests__/nightFeedbackQueue.test.ts`
- Create: `apps/storyteller/src/components/__tests__/nightFeedbackIntegrationSource.test.ts`

- [ ] **Step 1: Write failing integration assertions**

Verify the panel calls `getNightFeedbackSuggestion` with current target malfunction state and role-specific evidence, passes the result to `FeedbackComposer`, renders the result reason in `현재 추천 피드백`, and passes no suggestion when malfunctioning.

- [ ] **Step 2: Verify red**

Run the two focused feedback tests.

- [ ] **Step 3: Build the suggestion from existing evidence**

Reuse the already computed `empathHint`, `chefHint`, Fortune Teller action result, executed role, Ravenkeeper selected target role, and `jugglerCorrectCount`. Do not duplicate server adjudication. The selected feedback remains the payload sent by the control; the suggestion only changes presentation.

- [ ] **Step 4: Keep multi-target completion transactional**

Preserve `getPendingFeedbackIndex`. Advance `sentIndices` only after `{ success: true }`, keep the modal open and current choice available on failure, and call `onAllFeedbackSent` only after every target index succeeds.

- [ ] **Step 5: Verify and commit**

Run all storyteller feedback tests and typecheck.

```bash
git add apps/storyteller/src/components/NightFeedbackPanel.tsx apps/storyteller/src/components/NightPanel.tsx apps/storyteller/src/components/__tests__/nightFeedbackQueue.test.ts apps/storyteller/src/components/__tests__/nightFeedbackIntegrationSource.test.ts
git commit -m "fix: align night feedback suggestions with adjudication"
```

### Task 5: Workstream verification

- [ ] Run `pnpm --filter @clocktower/storyteller test`.
- [ ] Run `pnpm --filter @clocktower/storyteller typecheck`.
- [ ] Start the storyteller web app and inspect one numeric, yes/no, and role feedback modal at phone and desktop widths.
- [ ] Confirm the approved Korean-only angular design, 52px-or-larger controls, recommendation glow, collapse/resume, and malfunction warning.
- [ ] Run `git diff --check` and map requirement 14 to fresh automated and visual evidence.
