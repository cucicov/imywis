# Public Changelog

This changelog tracks public releases and delivered changes.

## Versioning Rules
- Version format: `MAJOR.MINOR.PATCH` (Semantic Versioning)
- `MAJOR`: breaking changes
- `MINOR`: new backward-compatible features
- `PATCH`: backward-compatible fixes

---
## [1.4.1] - 2026-08-27
### Summary
- EventNode can open multiple PageNodes: one primary redirect plus multiple pop-up pages.

### Added
- Multi-target navigation for click events: if an EventNode links to multiple PageNodes, exactly one can be a non-popup target (redirect), and any number can be pop-up targets (opened together).

### Changed
- Publishing and editor validation now enforce: max 1 PageNode with `popUp: false` per EventNode.

### Fixed

### Removed

### Security

### Notes

---
## [1.4.0] - 2026-08-24
### Summary
- Image scaling, improved copy-paste positioning, ASCII art support, and dynamic textbox sizing.

### Added
- Image Node scale attribute for proportional image resizing. A scale of `1` represents the unscaled image.
- Text Node support for preserving leading and trailing spaces in ASCII art.
- Dynamic sizing for text boxes.

### Changed
- Pasted nodes are now placed in the middle of the viewport.

### Fixed
- Copy-paste positioning issue.
- Text Node handling of leading and trailing spaces.

### Removed

### Security

### Notes

---
## [1.1.0] - 2026-04-19
### Summary
- Added signin/signup functionality.

### Added
- New login/signup page.
- Autosave option: OFF by default. Saves user project automatically each minute.
- Images can be uploaded from local machine. Drag and drop an image on the Image Node.

### Changed
- Now users will have to sign up with their email address before publishing. The publishing happens at the user custom url, not at /test anymore. The user custom user for now is the email handle used for the singup.

### Fixed
- User handle sanitization → remove any non alphanumeric characters from the user email handle.
- Fixed nodes disappearing when adding an event and a page node subsequently.

### Removed


### Security
- Users publishing dont interfere with each other. 

### Notes
- User handles are not configurable for the time being.

---
## [1.1.1] - 2026-04-23
### Summary
- Added fullscreen mode on Background Node.

### Added
- Now the Background Node can be set to fullscreen mode. Works like a cover for the whole size of the target page node.

### Changed

### Fixed

### Removed

### Security

### Notes

---
## [1.2.0] - 2026-04-23
### Summary
- New fonts available in the Text node. Minor bug fixes.

### Added
- New fonts in the Text node: Arimo-Regular, ChangaOne-Regular, HomeVideo-Regular, LiberationMono-Regular, PixelatedElegance, RasterForge, Tinos-Regular, Arvo-Regular, Comic-sans, Inter, Orbitron-Regular, PressStart2P-Regular, Roboto, VT323-Regular.

### Changed

### Fixed
- Bug with background node not scaling properly.
- Bug with event node click event not working properly in certain cases.

### Removed

### Security

### Notes
---
## [1.2.2] - 2026-05-12
### Summary
- Backend security updates.

### Added

### Changed

### Fixed

### Removed

### Security
- userId supabase check on publish.

### Notes
---
## [1.2.3] - 2026-05-13
### Summary
- Drag and drop images are saved in the database.

### Added

### Changed

### Fixed
- Local images are now saved in the database. This means that the project is editable even after clearing cache or if accessed from another computer.

### Removed

### Security

### Notes
---
## [1.3.0] - 2026-07-25
### Summary
- UI improvements on the client.

### Added
- Copy-Paste now works on components with CTRL+C/CTRL+V or CMD+C/CMD+V(mac).
- Delete key now works to remove components.

### Changed
- UI buttons moved to sticky header.

### Fixed

### Removed

### Security

### Notes
- To copy paste nodes, select with SHIFT+mouse drag and then CTRL+C/CMD+C -> CTRL+V/CMD+V.
---
## [1.3.1] - 2026-08-03
### Summary
- New node - Mask.

### Added
- new Mask node that can be used to mask images and texts. Introduces scrollable content inside the main window page.

### Changed

### Fixed

### Removed

### Security

### Notes
---
## [1.3.2] - 2026-08-06
### Summary
- Added automatic Page Node dimensions with minimum-size support.

### Added
- Page Node width and height now each have an `auto` option.

### Changed
- When an auto dimension is enabled, a page uses the larger of its configured dimension and the browser viewport when it opens. The size remains fixed after opening.

### Fixed
- Page content is no longer reduced below its configured width or height on smaller screens when auto dimensions are enabled.

### Removed

### Security

### Notes
