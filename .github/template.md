Branch Naming Convention

[type]/[scope]/[short-description]
Example:
> -frontend/feature/login-page

Commit Message Convention

type: subject

Structure
| Section | Description |
|----------|-------------|
| **type** | The kind of change being made |
| **scope** | The area of the codebase affected |
| **subject** | A short summary (max 100 chars, no period) |

Allowed Types
| Type | Description |
|------|--------------|
| feat | Introduces a new feature |
| fix | Fixes a bug |
| docs | Documentation updates only |
| style | Code style or formatting (no logic changes) |
| refactor | Code restructuring without behavior change |
| test | Adds or updates tests |
| chore | Maintenance tasks (config, dependencies, build) |
| perf | Performance improvements |
| revert | Reverts a previous commit |

| Scope | Meaning |
|--------|----------|
| frontend | Client/UI code |
| backend | Server or database logic |
| api | API endpoints or integrations |
| ui | UI/UX and visual components |
| infra | Infrastructure, CI/CD, configs |


Example: 
> -feat(frontend): add login modal
> -fix(backend): correct user query


Pull Request Template

Explain **what** this PR does and **why** it’s needed.

Type of Change
Check all that apply:

- **Feature** – New functionality  
- **Fix** – Bug fix  
- **Refactor** – Code restructuring  
- **Test** – Adding or modifying tests  
- **Chore** – Build/config changes, maintenance


Scope
- [ ] Frontend  
- [ ] Backend  
- [ ] API  
- [ ] UI/UX  
- [ ] Infra / CI/CD

Example:
> - Added a new login page with API integration
> - Fixed user authentication issue in backend service

