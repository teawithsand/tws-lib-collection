#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RtsGridCellContent {
    PATHABLE,
    BLOCKED,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MapCell {
    content: RtsGridCellContent,
}

impl MapCell {
    pub const fn new(content: RtsGridCellContent) -> Self {
        Self { content }
    }

    pub const fn pathable() -> Self {
        Self {
            content: RtsGridCellContent::PATHABLE,
        }
    }

    pub const fn blocked() -> Self {
        Self {
            content: RtsGridCellContent::BLOCKED,
        }
    }

    pub const fn is_pathable(self) -> bool {
        matches!(self.content, RtsGridCellContent::PATHABLE)
    }

    pub const fn is_blocked(self) -> bool {
        matches!(self.content, RtsGridCellContent::BLOCKED)
    }

    pub const fn content(self) -> RtsGridCellContent {
        self.content
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pathable_cell_is_pathable() {
        let cell = MapCell::pathable();
        assert!(cell.is_pathable());
        assert!(!cell.is_blocked());
    }

    #[test]
    fn blocked_cell_is_blocked() {
        let cell = MapCell::blocked();
        assert!(cell.is_blocked());
        assert!(!cell.is_pathable());
    }

    #[test]
    fn new_creates_correct_cell() {
        let pathable = MapCell::new(RtsGridCellContent::PATHABLE);
        assert!(pathable.is_pathable());

        let blocked = MapCell::new(RtsGridCellContent::BLOCKED);
        assert!(blocked.is_blocked());
    }

    #[test]
    fn content_returns_wrapped_value() {
        let cell = MapCell::pathable();
        assert_eq!(cell.content(), RtsGridCellContent::PATHABLE);
    }
}
