use std::marker::PhantomData;

use super::trait_registry::{ReadRegistry, WriteRegistry};
use crate::algo::registry::HandleType;

/// A simple append-only registry backed by a Vec
/// Handles are indices into the vec
#[derive(Debug, Clone)]
pub struct VecRegistry<T, H: HandleType = usize> {
    items: Vec<T>,
    _pd: PhantomData<H>,
}

impl<T, H: HandleType> VecRegistry<T, H> {
    /// Create a new empty VecRegistry
    pub fn new() -> Self {
        Self {
            items: Vec::new(),
            _pd: PhantomData,
        }
    }

    /// Create a new VecRegistry with specified capacity
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            items: Vec::with_capacity(capacity),
            _pd: PhantomData,
        }
    }
}

impl<T, H: HandleType> Default for VecRegistry<T, H> {
    fn default() -> Self {
        Self::new()
    }
}

impl<T, H: HandleType + 'static> ReadRegistry<T> for VecRegistry<T, H> {
    type Handle = H;

    #[inline]
    fn get(&self, handle: &Self::Handle) -> Option<&T> {
        self.items.get(handle.to_usize())
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
        self.items
            .iter()
            .enumerate()
            .map(|(i, v)| (H::from_usize(i).unwrap(), v))
    }

    #[inline]
    fn handles(&self) -> impl Iterator<Item = Self::Handle>
    where
        Self::Handle: 'static,
    {
        (0..self.items.len()).map(|i| H::from_usize(i).unwrap())
    }

    #[inline]
    fn get_mut(&mut self, handle: &Self::Handle) -> Option<&mut T> {
        self.items.get_mut(handle.to_usize())
    }

    #[inline]
    fn iter_mut<'a>(&'a mut self) -> impl Iterator<Item = (Self::Handle, &'a mut T)>
    where
        T: 'a,
    {
        self.items
            .iter_mut()
            .enumerate()
            .map(|(i, v)| (H::from_usize(i).unwrap(), v))
    }
}

impl<T, H: HandleType + 'static> WriteRegistry<T> for VecRegistry<T, H> {
    type Handle = H;

    #[inline]
    fn insert(&mut self, item: T) -> Self::Handle {
        let idx = self.items.len();
        self.items.push(item);
        H::from_usize(idx).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_registry_is_empty() {
        let registry: VecRegistry<i32> = VecRegistry::new();
        assert!(registry.is_empty());
        assert_eq!(registry.len(), 0);
    }

    #[test]
    fn test_insert_returns_handle() {
        let mut registry = VecRegistry::<i32, usize>::new();
        let handle1 = registry.insert(42);
        let handle2 = registry.insert(99);

        assert_eq!(handle1, 0);
        assert_eq!(handle2, 1);
    }

    #[test]
    fn test_get_returns_inserted_item() {
        let mut registry = VecRegistry::<&str, usize>::new();
        let handle = registry.insert("hello");

        assert_eq!(registry.get(&handle), Some(&"hello"));
    }

    #[test]
    fn test_get_invalid_handle_returns_none() {
        let registry: VecRegistry<i32> = VecRegistry::new();
        assert_eq!(registry.get(&0), None);
        assert_eq!(registry.get(&999), None);
    }

    #[test]
    fn test_len_tracks_item_count() {
        let mut registry = VecRegistry::<i32, usize>::new();
        assert_eq!(registry.len(), 0);

        registry.insert(1);
        assert_eq!(registry.len(), 1);

        registry.insert(2);
        assert_eq!(registry.len(), 2);

        registry.insert(3);
        assert_eq!(registry.len(), 3);
    }

    #[test]
    fn test_contains_handle_for_valid_handles() {
        let mut registry = VecRegistry::<&str, usize>::new();
        let h1 = registry.insert("a");
        let h2 = registry.insert("b");

        assert!(registry.contains_handle(&h1));
        assert!(registry.contains_handle(&h2));
    }

    #[test]
    fn test_contains_handle_for_invalid_handles() {
        let mut registry = VecRegistry::<&str, usize>::new();
        registry.insert("a");

        assert!(!registry.contains_handle(&999));
        assert!(!registry.contains_handle(&10));
    }

    #[test]
    fn test_iter_yields_all_items_in_order() {
        let mut registry = VecRegistry::<i32, usize>::new();
        let h1 = registry.insert(10);
        let h2 = registry.insert(20);
        let h3 = registry.insert(30);

        let items: Vec<_> = registry.iter().collect();

        assert_eq!(items.len(), 3);
        assert_eq!(items[0], (h1, &10));
        assert_eq!(items[1], (h2, &20));
        assert_eq!(items[2], (h3, &30));
    }

    #[test]
    fn test_handles_yields_all_handles() {
        let mut registry = VecRegistry::<char, usize>::new();
        registry.insert('a');
        registry.insert('b');
        registry.insert('c');

        let handles: Vec<_> = registry.handles().collect();

        assert_eq!(handles, vec![0, 1, 2]);
    }

    #[test]
    fn test_handles_on_empty_registry() {
        let registry: VecRegistry<i32> = VecRegistry::new();
        let handles: Vec<_> = registry.handles().collect();

        assert!(handles.is_empty());
    }

    #[test]
    fn test_with_capacity_creates_empty_registry() {
        let registry: VecRegistry<i32> = VecRegistry::with_capacity(100);
        assert!(registry.is_empty());
        assert_eq!(registry.len(), 0);
    }

    #[test]
    fn test_multiple_inserts_maintain_correct_references() {
        let mut registry = VecRegistry::<usize, usize>::new();
        let handles: Vec<_> = (0..10).map(|i| registry.insert(i * 2)).collect();

        // Verify all items are still accessible
        for (i, &handle) in handles.iter().enumerate() {
            assert_eq!(registry.get(&handle), Some(&(i * 2)));
        }
    }

    #[test]
    fn test_default_creates_empty_registry() {
        let registry: VecRegistry<String> = VecRegistry::default();
        assert!(registry.is_empty());
    }
}
