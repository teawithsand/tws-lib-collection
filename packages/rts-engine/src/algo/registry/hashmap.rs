use super::handle::HandleType;
use super::trait_registry::{ReadRegistry, Registry, RemovableRegistry, WriteRegistry};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct HashMapRegistry<T, H: HandleType> {
    items: HashMap<H, T>,
    next_handle: H,
}

impl<T, H: HandleType> Default for HashMapRegistry<T, H> {
    #[inline]
    fn default() -> Self {
        Self::new()
    }
}

impl<T, H: HandleType> HashMapRegistry<T, H> {
    #[inline]
    pub fn new() -> Self {
        Self {
            items: HashMap::new(),
            next_handle: H::zero(),
        }
    }
}

impl<T, H: HandleType + 'static> ReadRegistry<T> for HashMapRegistry<T, H> {
    type Handle = H;

    #[inline]
    fn get(&self, handle: &Self::Handle) -> Option<&T> {
        self.items.get(handle)
    }

    #[inline]
    fn len(&self) -> usize {
        self.items.len()
    }

    #[inline]
    fn iter<'a>(&'a self) -> impl Iterator<Item = (Self::Handle, &'a T)>
    where
        T: 'a,
    {
        self.items.iter().map(|(h, v)| (*h, v))
    }

    #[inline]
    fn handles(&self) -> impl Iterator<Item = Self::Handle>
    where
        Self::Handle: 'static,
    {
        self.items.keys().copied()
    }

    #[inline]
    fn get_mut(&mut self, handle: &Self::Handle) -> Option<&mut T> {
        self.items.get_mut(handle)
    }

    #[inline]
    fn iter_mut<'a>(&'a mut self) -> impl Iterator<Item = (Self::Handle, &'a mut T)>
    where
        T: 'a,
    {
        self.items.iter_mut().map(|(h, v)| (*h, v))
    }
}

impl<T, H: HandleType + 'static> WriteRegistry<T> for HashMapRegistry<T, H> {
    type Handle = H;

    #[inline]
    fn insert(&mut self, item: T) -> Self::Handle {
        let handle = self.next_handle;
        self.next_handle = self.next_handle.next();
        self.items.insert(handle, item);
        handle
    }
}

impl<T, H: HandleType + 'static> RemovableRegistry<T> for HashMapRegistry<T, H> {
    type Handle = H;

    #[inline]
    fn remove(&mut self, handle: &Self::Handle) -> Option<T> {
        self.items.remove(handle)
    }

    #[inline]
    fn clear(&mut self) {
        self.items.clear();
    }
}

impl<T, H: HandleType + 'static> Registry<T> for HashMapRegistry<T, H> {}
