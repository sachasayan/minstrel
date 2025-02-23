## Development Plan

### Phase 1: Core Functionality

- [ ] **Skeleton Generation** (COMPLETE)
  - [x] Implement UI for story parameter input
  - [x] Implement service logic to send parameters to the model
  - [x] Implement model logic to generate a story skeleton
  - [x] Display the skeleton in the UI
- [ ] **Outline Generation** (COMPLETE)
  - [x] Implement UI to trigger outline generation
  - [x] Implement service logic to send the skeleton to the model
  - [x] Implement model logic to generate a story outline
  - [x] Display the outline in the UI
- [x] **Chapter Generation** (Partially Complete)
  - [x] Implement service logic to send the outline and previous chapter to the model
  - [x] Implement model logic to generate a chapter
  - [ ] Implement UI to trigger chapter generation
  - [ ] Display the chapter in the UI
- [ ] **Critique Generation** (UNFINISHED)
  - [x] Implement service logic to send all chapters to the model
  - [x] Implement model logic to generate a critique
  - [x] Implement UI to trigger critique generation
  - [x] Display the critique in the UI

### Phase 2: UI/UX Improvements

- [ ] **Loading States** (UNFINISHED)
  - [ ] Implement loading indicators for all API calls
- [ ] **Feedback Mechanisms** (UNFINISHED)
  - [ ] Implement user-friendly error messages
  - [ ] Implement success messages
- [ ] **Overall Polish** (UNFINISHED)
  - [ ] Review and improve the UI/UX throughout the application

### Phase 3: Advanced Features

- [ ] **Versioning** (UNFINISHED)
  - [ ] Implement a versioning system for project files
- [ ] **Regeneration/Rewriting** (UNFINISHED)
  - [ ] Implement service and model logic to allow regenerating/rewriting specific parts of the novel
- [ ] **User Editing** (UNFINISHED)
  - [ ] Allow the user to directly edit the generated files within the app
- [ ] **Additional Tools** (UNFINISHED)
  - [ ] Explore the possibility of adding more tools for the model to use

### Phase 4: Error Handling and Testing

- [ ] **Expanded Error Handling** (UNFINISHED)
  - [ ] Implement more robust error handling throughout the application
  - [ ] Implement a more sophisticated retry mechanism for "resource exhausted" errors, including:
    - Exponential backoff for retries.
    - Limiting the number of retries specifically for resource exhaustion errors.
    - Logging or alerting for frequent resource exhaustion errors.
- [ ] **Testing** (UNFINISHED)
  - [ ] Implement comprehensive testing of all features and workflows

### Phase 5: Dashboard Work

- [ ] **Dashboard Implementation** (UNFINISHED)
  - [x] Display novel summary.
  - [x] Display word count per chapter.
  - [x] Display character mentions per chapter.
  - [ ] Implement dynamic colors for charts.
