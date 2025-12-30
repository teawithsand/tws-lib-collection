/// A cell in the spatial hash map that stores handles to shapes intersecting this cell.
#[derive(Debug, Clone)]
pub(super) struct Cell<H> {
    handles: Vec<H>,
}

impl<H> Default for Cell<H> {
    fn default() -> Self {
        Self {
            handles: Vec::new(),
        }
    }
}

impl<H> Cell<H> {
    /// Insert a handle into this cell.
    #[inline]
    pub fn insert(&mut self, handle: H) {
        self.handles.push(handle);
    }
}

impl<H: PartialEq> Cell<H> {
    /// Remove a handle from this cell.
    ///
    /// This removes all occurrences of the handle (though there should only be one).
    #[inline]
    pub fn remove(&mut self, handle: &H) {
        self.handles.retain(|h| h != handle);
    }
}

impl<H> Cell<H> {
    /// Iterate over all handles in this cell.
    #[inline]
    pub fn iter(&self) -> impl Iterator<Item = &H> {
        self.handles.iter()
    }
}
