//! A generational arena-based registry that prevents the ABA problem.
//!
//! This registry uses generation counters to invalidate handles when items are removed,
//! ensuring that old handles cannot accidentally access new data inserted at the same index.

use std::{marker::PhantomData, mem::MaybeUninit};

use bitvec::vec::BitVec;

use super::trait_registry::{ReadRegistry, Registry, RemovableRegistry, WriteRegistry};
use crate::algo::registry::HandleType;

/// A handle to an item in a generational registry.
///
/// Contains both an index and a generation counter. The generation counter is incremented
/// each time an item at that index is removed, preventing old handles from accessing new data.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct GenerationalRegistryHandle<H: HandleType, G: HandleType> {
    index: H,
    generation: G,
}

/// A generational arena that stores items with stable handles.
///
/// This registry maintains generation counters to prevent the ABA problem where a handle
/// to a removed item could accidentally access a different item inserted at the same index.
/// When an item is removed, its generation is incremented, invalidating all old handles.
///
/// # Type Parameters
/// * `T` - The type of items stored in the registry
/// * `H` - The handle index type (typically `u32` or `u64`)
/// * `G` - The generation counter type (typically `u32` or `u64`)
///
/// # Memory Efficiency
/// - Reuses freed slots via a free list
/// - Uses `BitVec` for efficient occupancy tracking
/// - Stores items in a contiguous `Vec` for cache efficiency
#[derive(Debug)]
pub struct GenerationalRegistry<T, H: HandleType, G: HandleType> {
    array: Vec<std::mem::MaybeUninit<T>>,
    generations: Vec<G>,
    // TODO(teaiwthsand): make it vec of u32 or usize and upgrade to usize whole vector(like as an enum) when it grows too big.
    //  perhaps do simmilar optimization for u8 and u16
    free_list: Vec<H>,
    // This is not needed for pointers, which have special interpretation over Option<T> type,
    // but this is fine as well I guess. A bit per item is not that much.
    usage_tracking: BitVec,
    _pd: PhantomData<H>,
}

impl<T, H: HandleType, G: HandleType> Default for GenerationalRegistry<T, H, G> {
    #[inline]
    fn default() -> Self {
        Self {
            array: Vec::new(),
            generations: Vec::new(),
            free_list: Vec::new(),
            usage_tracking: BitVec::new(),
            _pd: PhantomData,
        }
    }
}

impl<T, H: HandleType + 'static, G: HandleType + 'static> ReadRegistry<T>
    for GenerationalRegistry<T, H, G>
{
    type Handle = GenerationalRegistryHandle<H, G>;

    /// Returns a reference to the item associated with the given handle.
    ///
    /// Returns `None` if:
    /// - The handle's index is out of bounds
    /// - The handle's generation doesn't match (item was removed)
    /// - The slot is currently unoccupied
    #[inline]
    fn get(&self, handle: &Self::Handle) -> Option<&T> {
        if handle.index.to_usize() >= self.array.len() {
            return None;
        }

        if handle.generation != self.generations[handle.index.to_usize()] {
            return None;
        }

        if !self.usage_tracking[handle.index.to_usize()] {
            return None;
        }

        return Some(unsafe { self.array[handle.index.to_usize()].assume_init_ref() });
    }

    /// Returns the number of items currently stored in the registry.
    ///
    /// This is calculated as the total capacity minus the number of freed slots.
    #[inline]
    fn len(&self) -> usize {
        return self.array.len() - self.free_list.len();
    }

    /// Returns an iterator over all items in the registry with their handles.
    ///
    /// Only returns items that are currently valid (not removed).
    /// The iteration order is based on the internal array indices.
    #[inline]
    fn iter<'a>(&'a self) -> impl Iterator<Item = (Self::Handle, &'a T)>
    where
        T: 'a,
    {
        self.usage_tracking
            .iter()
            .zip(self.array.iter().zip(self.generations.iter()))
            .enumerate()
            .filter_map(|(i, (filled, (item, gen)))| {
                if !*filled {
                    return None;
                }

                return Some((
                    GenerationalRegistryHandle {
                        generation: *gen,
                        index: H::from_usize(i).unwrap(),
                    },
                    unsafe { item.assume_init_ref() },
                ));
            })
    }

    /// Returns an iterator over all valid handles in the registry.
    ///
    /// Only returns handles for items that are currently stored (not removed).
    /// The iteration order is based on the internal array indices.
    #[inline]
    fn handles(&self) -> impl Iterator<Item = Self::Handle>
    where
        Self::Handle: 'static,
    {
        self.usage_tracking
            .iter()
            .zip(self.generations.iter())
            .enumerate()
            .filter_map(|(i, (filled, g))| {
                if !*filled {
                    return None;
                }
                H::from_usize(i).map(|index| GenerationalRegistryHandle {
                    index,
                    generation: *g,
                })
            })
    }

    /// Returns a mutable reference to the item associated with the given handle.
    ///
    /// Returns `None` if:
    /// - The handle's index is out of bounds
    /// - The handle's generation doesn't match (item was removed)
    /// - The slot is currently unoccupied
    #[inline]
    fn get_mut(&mut self, handle: &Self::Handle) -> Option<&mut T> {
        if handle.index.to_usize() >= self.array.len() {
            return None;
        }

        if handle.generation != self.generations[handle.index.to_usize()] {
            return None;
        }

        if !self.usage_tracking[handle.index.to_usize()] {
            return None;
        }

        return Some(unsafe { self.array[handle.index.to_usize()].assume_init_mut() });
    }

    /// Returns a mutable iterator over all items in the registry with their handles.
    ///
    /// Only returns items that are currently valid (not removed).
    /// The iteration order is based on the internal array indices.
    #[inline]
    fn iter_mut<'a>(&'a mut self) -> impl Iterator<Item = (Self::Handle, &'a mut T)>
    where
        T: 'a,
    {
        self.usage_tracking
            .iter()
            .zip(self.array.iter_mut().zip(self.generations.iter()))
            .enumerate()
            .filter_map(|(i, (filled, (item, gen)))| {
                if !*filled {
                    return None;
                }

                return Some((
                    GenerationalRegistryHandle {
                        generation: *gen,
                        index: H::from_usize(i).unwrap(),
                    },
                    unsafe { item.assume_init_mut() },
                ));
            })
    }
}

impl<T, H: HandleType + 'static, G: HandleType + 'static> WriteRegistry<T>
    for GenerationalRegistry<T, H, G>
{
    type Handle = GenerationalRegistryHandle<H, G>;

    /// Inserts an item into the registry and returns a handle to it.
    ///
    /// If there are freed slots available, one will be reused with an incremented generation.
    /// Otherwise, a new slot is allocated at the end of the internal array.
    #[inline]
    fn insert(&mut self, item: T) -> Self::Handle {
        if let Some(raw_idx) = self.free_list.pop() {
            let idx = raw_idx.to_usize();
            let next_gen = self.generations[idx].next();

            self.usage_tracking.set(idx, true);

            self.array[idx] = MaybeUninit::new(item);
            self.generations[idx] = next_gen;

            return GenerationalRegistryHandle {
                generation: next_gen,
                index: raw_idx,
            };
        } else {
            self.array.push(MaybeUninit::new(item));
            self.generations.push(G::one());
            self.usage_tracking.push(true);

            let idx = H::from_usize(self.array.len() - 1).unwrap();

            return GenerationalRegistryHandle {
                generation: G::one(),
                index: idx,
            };
        }
    }
}

impl<T, H: HandleType + 'static, G: HandleType + 'static> RemovableRegistry<T>
    for GenerationalRegistry<T, H, G>
{
    type Handle = GenerationalRegistryHandle<H, G>;

    /// Removes and returns the item associated with the given handle.
    ///
    /// The slot is marked as free and added to the free list for reuse.
    /// Subsequent operations with the same handle will fail as the generation will be incremented
    /// on the next insertion at this index.
    ///
    /// Returns `None` if:
    /// - The handle's index is out of bounds
    /// - The handle's generation doesn't match (item was already removed)
    /// - The slot is currently unoccupied
    #[inline]
    fn remove(&mut self, handle: &Self::Handle) -> Option<T> {
        if handle.index.to_usize() >= self.array.len() {
            return None;
        }

        if handle.generation != self.generations[handle.index.to_usize()] {
            return None;
        }

        if !self.usage_tracking[handle.index.to_usize()] {
            return None;
        }

        let idx = handle.index.to_usize();
        let old_value = std::mem::replace(&mut self.array[idx], MaybeUninit::uninit());
        self.free_list.push(handle.index);
        self.usage_tracking.set(idx, false);

        return Some(unsafe { old_value.assume_init() });
    }

    /// Removes all items from the registry and drops them.
    ///
    /// After calling this method, all existing handles become invalid.
    /// The internal capacity is preserved, and all slots are marked as free.
    ///
    /// # Performance
    /// Uses an optimized path when the free list is small (linear scan with contains check)
    /// or a sorted merge approach when the free list is large.
    #[inline]
    fn clear(&mut self) {
        if self.free_list.len() < 4096 / std::mem::size_of::<H>() {
            for i in 0..self.array.len() {
                if !self.free_list.contains(&H::from_usize(i).unwrap()) {
                    unsafe { self.array[i].assume_init_drop() };
                }
            }
        } else {
            self.free_list.sort_unstable_by_key(|h| h.to_usize());
            let mut free_idx = 0;
            for i in 0..self.array.len() {
                let is_free = if free_idx < self.free_list.len() {
                    let free_list_value = self.free_list[free_idx].to_usize();
                    if free_list_value == i {
                        free_idx += 1;
                        true
                    } else {
                        false
                    }
                } else {
                    false
                };

                if !is_free {
                    unsafe { self.array[i].assume_init_drop() };
                }
            }
        }

        self.usage_tracking.fill(false);
        self.free_list.clear();
        self.free_list
            .extend((0..self.array.len()).map(|i| H::from_usize(i).unwrap()));
    }
}

impl<T, H: HandleType + 'static, G: HandleType + 'static> Registry<T>
    for GenerationalRegistry<T, H, G>
{
}

#[cfg(test)]
mod tests {
    use super::*;

    type TestRegistry<T> = GenerationalRegistry<T, u32, u32>;

    #[test]
    fn test_basic_insert_and_get() {
        let mut registry = TestRegistry::<i32>::default();

        let handle = registry.insert(42);
        assert_eq!(registry.get(&handle), Some(&42));
        assert_eq!(registry.len(), 1);
    }

    #[test]
    fn test_multiple_inserts() {
        let mut registry = TestRegistry::<String>::default();

        let h1 = registry.insert("first".to_string());
        let h2 = registry.insert("second".to_string());
        let h3 = registry.insert("third".to_string());

        assert_eq!(registry.get(&h1), Some(&"first".to_string()));
        assert_eq!(registry.get(&h2), Some(&"second".to_string()));
        assert_eq!(registry.get(&h3), Some(&"third".to_string()));
        assert_eq!(registry.len(), 3);
    }

    #[test]
    fn test_get_mut() {
        let mut registry = TestRegistry::<i32>::default();
        let handle = registry.insert(10);

        if let Some(value) = registry.get_mut(&handle) {
            *value = 20;
        }

        assert_eq!(registry.get(&handle), Some(&20));
    }

    #[test]
    fn test_remove() {
        let mut registry = TestRegistry::<i32>::default();
        let handle = registry.insert(100);

        assert_eq!(registry.len(), 1);
        let removed = registry.remove(&handle);

        assert_eq!(removed, Some(100));
        assert_eq!(registry.len(), 0);
        assert_eq!(registry.get(&handle), None);
    }

    #[test]
    fn test_stale_handle_after_remove() {
        let mut registry = TestRegistry::<i32>::default();
        let handle = registry.insert(42);

        registry.remove(&handle);

        // Stale handle should return None
        assert_eq!(registry.get(&handle), None);
        assert_eq!(registry.get_mut(&handle), None);
        assert_eq!(registry.remove(&handle), None);
    }

    #[test]
    fn test_reuse_of_freed_slots() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(1);
        let h2 = registry.insert(2);
        let h3 = registry.insert(3);

        // Remove middle item
        registry.remove(&h2);

        // Insert new item - should reuse slot
        let h4 = registry.insert(4);

        // Old handle should not work
        assert_eq!(registry.get(&h2), None);
        // New handle should work
        assert_eq!(registry.get(&h4), Some(&4));
        // Other handles still work
        assert_eq!(registry.get(&h1), Some(&1));
        assert_eq!(registry.get(&h3), Some(&3));
        assert_eq!(registry.len(), 3);
    }

    #[test]
    fn test_generation_prevents_aba_problem() {
        let mut registry = TestRegistry::<String>::default();

        let h1 = registry.insert("first".to_string());
        let old_handle = h1.clone();

        registry.remove(&h1);
        let h2 = registry.insert("second".to_string());

        // Old handle should not access new value even if same slot
        assert_eq!(registry.get(&old_handle), None);
        assert_eq!(registry.get(&h2), Some(&"second".to_string()));
    }

    #[test]
    fn test_clear() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(1);
        let h2 = registry.insert(2);
        let h3 = registry.insert(3);

        registry.clear();

        assert_eq!(registry.len(), 0);
        assert_eq!(registry.get(&h1), None);
        assert_eq!(registry.get(&h2), None);
        assert_eq!(registry.get(&h3), None);
    }

    #[test]
    fn test_clear_with_freed_slots() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(1);
        let h2 = registry.insert(2);
        let h3 = registry.insert(3);

        registry.remove(&h2);

        registry.clear();

        assert_eq!(registry.len(), 0);
        assert_eq!(registry.get(&h1), None);
        assert_eq!(registry.get(&h3), None);
    }

    #[test]
    fn test_is_empty() {
        let mut registry = TestRegistry::<i32>::default();

        assert!(registry.is_empty());

        let h1 = registry.insert(1);
        assert!(!registry.is_empty());

        registry.remove(&h1);
        assert!(registry.is_empty());
    }

    #[test]
    fn test_contains_handle() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(1);
        assert!(registry.contains_handle(&h1));

        registry.remove(&h1);
        assert!(!registry.contains_handle(&h1));
    }

    #[test]
    fn test_iter() {
        let mut registry = TestRegistry::<i32>::default();

        let _h1 = registry.insert(10);
        let _h2 = registry.insert(20);
        let _h3 = registry.insert(30);

        let items: Vec<_> = registry.iter().map(|(_, v)| *v).collect();
        assert_eq!(items.len(), 3);
        assert!(items.contains(&10));
        assert!(items.contains(&20));
        assert!(items.contains(&30));
    }

    #[test]
    fn test_iter_with_removed_items() {
        let mut registry = TestRegistry::<i32>::default();

        let _h1 = registry.insert(10);
        let h2 = registry.insert(20);
        let _h3 = registry.insert(30);

        registry.remove(&h2);

        let items: Vec<_> = registry.iter().map(|(_, v)| *v).collect();
        assert_eq!(items.len(), 2);
        assert!(items.contains(&10));
        assert!(items.contains(&30));
        assert!(!items.contains(&20));
    }

    #[test]
    fn test_iter_mut() {
        let mut registry = TestRegistry::<i32>::default();

        registry.insert(10);
        registry.insert(20);
        registry.insert(30);

        for (_, value) in registry.iter_mut() {
            *value *= 2;
        }

        let items: Vec<_> = registry.iter().map(|(_, v)| *v).collect();
        assert!(items.contains(&20));
        assert!(items.contains(&40));
        assert!(items.contains(&60));
    }

    #[test]
    fn test_handles() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(10);
        let h2 = registry.insert(20);
        let h3 = registry.insert(30);

        let handles: Vec<_> = registry.handles().collect();
        assert_eq!(handles.len(), 3);
        assert!(handles.contains(&h1));
        assert!(handles.contains(&h2));
        assert!(handles.contains(&h3));
    }

    #[test]
    fn test_handles_excludes_removed() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(10);
        let h2 = registry.insert(20);
        let h3 = registry.insert(30);

        registry.remove(&h2);

        let handles: Vec<_> = registry.handles().collect();
        assert_eq!(handles.len(), 2);
        assert!(handles.contains(&h1));
        assert!(!handles.contains(&h2));
        assert!(handles.contains(&h3));
    }

    #[test]
    fn test_stress_insert_remove_cycle() {
        let mut registry = TestRegistry::<usize>::default();
        let mut handles = Vec::new();

        // Insert many items
        for i in 0..100 {
            handles.push(registry.insert(i));
        }

        assert_eq!(registry.len(), 100);

        // Remove every other item
        for i in (0..100).step_by(2) {
            registry.remove(&handles[i]);
        }

        assert_eq!(registry.len(), 50);

        // Insert more items (should reuse slots)
        for i in 100..150 {
            registry.insert(i);
        }

        assert_eq!(registry.len(), 100);
    }

    #[test]
    fn test_drop_tracking() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::sync::Arc;

        let drop_count = Arc::new(AtomicUsize::new(0));

        struct DropCounter {
            count: Arc<AtomicUsize>,
        }

        impl Drop for DropCounter {
            fn drop(&mut self) {
                self.count.fetch_add(1, Ordering::SeqCst);
            }
        }

        let mut registry = GenerationalRegistry::<DropCounter, u32, u32>::default();

        let _h1 = registry.insert(DropCounter {
            count: drop_count.clone(),
        });
        let h2 = registry.insert(DropCounter {
            count: drop_count.clone(),
        });
        let _h3 = registry.insert(DropCounter {
            count: drop_count.clone(),
        });

        assert_eq!(drop_count.load(Ordering::SeqCst), 0);

        registry.remove(&h2);
        assert_eq!(drop_count.load(Ordering::SeqCst), 1);

        registry.clear();
        assert_eq!(drop_count.load(Ordering::SeqCst), 3);
    }

    #[test]
    fn test_empty_registry_operations() {
        let mut registry = TestRegistry::<i32>::default();

        assert_eq!(registry.len(), 0);
        assert!(registry.is_empty());
        assert_eq!(registry.iter().count(), 0);
        assert_eq!(registry.handles().count(), 0);

        registry.clear(); // Should not panic
        assert_eq!(registry.len(), 0);
    }

    #[test]
    fn test_invalid_handle() {
        let mut registry1 = TestRegistry::<i32>::default();
        let mut registry2 = TestRegistry::<i32>::default();

        let h1 = registry1.insert(42);

        // Handle from registry1 should not work on registry2
        assert_eq!(registry2.get(&h1), None);
        assert_eq!(registry2.remove(&h1), None);
    }

    #[test]
    fn test_handle_equality() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(1);
        let h1_copy = h1.clone();

        assert_eq!(h1, h1_copy);
        assert_eq!(registry.get(&h1), registry.get(&h1_copy));
    }

    #[test]
    fn test_reinsert_after_clear() {
        let mut registry = TestRegistry::<i32>::default();

        let h1 = registry.insert(1);
        registry.clear();

        let h2 = registry.insert(2);

        assert_eq!(registry.get(&h1), None);
        assert_eq!(registry.get(&h2), Some(&2));
        assert_eq!(registry.len(), 1);
    }
}
