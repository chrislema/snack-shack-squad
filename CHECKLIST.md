# The "Did it actually work?" checklist for vibe-coded apps

For non-technical people who build apps with Lovable, Replit, Bolt, v0, or similar AI builders. No code reading required.

Two parts: **(A)** what to tell the AI builder *up front*, and **(B)** what to check yourself *after* it says "done."

---

## Part A — Paste this at the start of your project

> When you build this app, please follow these rules and tell me explicitly when you've done each one:
>
> 1. **No secrets in the repo.** Put API keys, passwords, and tokens in environment variables. Make sure the file holding them (usually `.env`) is in `.gitignore` from the very first commit. Confirm in writing: "no secrets are committed to git."
> 2. **Server-side rules, not just screen rules.** For every rule like "only the owner can edit this" or "only paying users can do X" or "max 5 per account" — enforce it in the database or backend, not only by hiding the button. Tell me which rules are enforced where.
> 3. **Show me errors.** When something fails (a save, a login, a payment), I want a visible message. Never swallow errors silently. If you call something and it returns an error, show it to the user or log it where I can see it.
> 4. **Tell me what happens if two people click at the same time.** For anything with a limit ("first 10 signups," "claim this slot," "only one winner"), explain how you prevent both people from succeeding. If you can't, flag it.
> 5. **Tell me what happens when a second customer / group / team signs up.** Will they see each other's data? If this app is supposed to be private per account, show me the rule that enforces that.
> 6. **Confirmations should reflect reality.** Don't show "Saved!" unless it actually saved. Don't show "Sent!" unless it actually sent. If part of the operation failed, say so.
> 7. **Test with two accounts.** Before saying "done," walk me through how you tested it as User A *and* User B logged in at the same time, and what each one sees.
> 8. **Don't invent loading states.** If data is loading, show a loading state. If it's empty, show an empty state. If it failed, show a failed state. Three different things, three different screens.

That single paragraph would prevent the majority of issues in a typical AI-generated app.

---

## Part B — Things to check after it says "done"

Click through these as a non-technical person. You don't need to read code.

### 1. The "two browsers" test

Open the app in two different browsers, signed in as two different users. Then:

- Have User A create something. Does User B see it appear? Should they?
- Have both users click the same "claim" / "buy" / "reserve" button at the *same time*. Do both succeed? If yes, ask the AI: "why did both succeed when only one should have?"
- Sign User A out. Can User B still see User A's stuff if they shouldn't?

This single test catches the majority of silent-failure bugs.

### 2. The "did it really save?" test

After every important action (post, save, send, pay):

- Refresh the page. Is the change still there?
- Sign out, sign back in. Still there?
- Check it from a different account. Does it look right from the outside?

If "Saved!" appears but a refresh shows the old data, the app is lying to you. This is the #1 thing AI-built apps get wrong.

### 3. The "what if I'm sneaky" test

You don't need to be a hacker:

- Open the browser's dev tools (right-click → Inspect → Network tab). Click around. Are passwords or secrets visible in the requests? Are you seeing other people's data come back when you should only see your own?
- Try editing the URL. If clicking a project takes you to `/projects/123`, change it to `/projects/124`. Do you see someone else's project? You shouldn't.
- Try doing something the UI hides. If "Delete" is only shown to admins, log in as a regular user and ask the AI: "can a regular user still delete this by other means?"

### 4. The "error path" test

Deliberately break things and watch what happens:

- Submit a form with the internet disconnected.
- Type a wrong password. Do you get a clear message?
- Try to upload a file that's too big. Clear message?
- Click "Save" twice fast. Did it save twice?

If the app does *nothing visible* when something goes wrong, that's a silent failure. Make the AI fix it.

### 5. The "second customer" test

- Sign up as a brand new user with a fresh email. Do you see a clean, empty app — or do you see another user's data?
- Create something as the new user. Switch back to the old account. Does the old account see the new user's stuff?

For anything meant to be private (a CRM, a project tool, a journal), this catches multi-tenancy bugs that AI builders won't catch on their own.

### 6. The "1 vs. 1,000" test

- How does the app behave when there's *no* data? (Empty list, first-time user.)
- How does it behave with one item?
- Ask the AI: "if this list grows to 1,000 items, what slows down or breaks?"

### 7. The secrets check

Ask the AI directly:

> "List every secret, API key, or password used by this app. For each one, tell me: where is it stored, is it in git history, and is it visible to users in their browser?"

A good answer names each key and says "stored in environment variables, not committed, not exposed to browser." A bad answer is vague.

### 8. The "what's enforced where" check

Ask the AI directly:

> "For every rule in this app — who can see what, who can edit what, who can buy what, what limits exist — tell me whether the rule is enforced in the database, the backend, or only the user interface. If it's only the user interface, say so plainly."

Anything that's "only the user interface" is a rule that doesn't actually exist. Push back and ask for it to be enforced server-side.

---

## The mental model

The single most important thing for a non-technical builder to internalize:

> **A button being hidden is not the same as an action being prevented.**

AI builders are very good at hiding buttons. They are mediocre at preventing actions. Almost every "scary but not catastrophic" bug in a vibe-coded app comes from this gap — the screen says one thing, the database allows another, and you don't find out until two users do something at once.

The checklist above is really one question asked eight different ways: *"is what I see on screen what's actually true in the database?"* If you make the AI answer that question for every feature, before you ship, you avoid 90% of the embarrassment.
