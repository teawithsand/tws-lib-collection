use std::hash::Hash;

/// Read-only registry trait for querying items by handle
pub trait ReadRegistry<T> {
    type Handle: Copy + Clone + Eq + Hash + std::fmt::Debug;

    fn get(&self, handle: &Self::Handle) -> Option<&T>;
    fn len(&self) -> usize;

    fn is_empty(&self) -> bool {
        self.len() == 0
    }

    fn contains_handle(&self, handle: &Self::Handle) -> bool {
        self.get(handle).is_some()
    }

    fn get_mut(&mut self, handle: &Self::Handle) -> Option<&mut T>;
    fn iter_mut<'a>(&'a mut self) -> impl Iterator<Item = (Self::Handle, &'a mut T)>
    where
        T: 'a;

    fn iter<'a>(&'a self) -> impl Iterator<Item = (Self::Handle, &'a T)>
    where
        T: 'a;

    fn handles(&self) -> impl Iterator<Item = Self::Handle>;
}

/// Write-only registry trait for inserting items
pub trait WriteRegistry<T> {
    type Handle: Copy + Clone + Eq + Hash + std::fmt::Debug;

    fn insert(&mut self, item: T) -> Self::Handle;
}

/// Registry trait that supports removal operations
pub trait RemovableRegistry<T> {
    type Handle: Copy + Clone + Eq + Hash + std::fmt::Debug;

    fn remove(&mut self, handle: &Self::Handle) -> Option<T>;
    fn clear(&mut self);
}

/// Full registry trait combining read, write, and removal operations
pub trait Registry<T>: ReadRegistry<T> + WriteRegistry<T> + RemovableRegistry<T> {
    // All functionality is inherited from the component traits
}
