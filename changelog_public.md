# Public Changelog

This changelog tracks public releases and delivered changes.

## Versioning Rules
- Version format: `MAJOR.MINOR.PATCH` (Semantic Versioning)
- `MAJOR`: breaking changes
- `MINOR`: new backward-compatible features
- `PATCH`: backward-compatible fixes

---
## [1.1.0] - 2026-04-19
### Summary
- Added signin/signup functionality.

### Added
- New login/signup page.
- Autosave option: OFF by default. Saves user project automatically each minute.

### Changed
- Now users will have to sign up with their email address before publishing. The publishing happens at the user custom url, not at /test anymore. The user custom user for no is the email handle used for the singup.

### Fixed
- User handle sanitization → remove any non alphanumeric characters from the user email handle.

### Removed


### Security
- Users publishing dont interfere with each other. 

### Notes
- User handles are not configurable for the time being.
