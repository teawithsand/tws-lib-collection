mod array_registry;
mod generational;
mod handle;
mod hashmap;
mod trait_registry;
mod vec_registry;

pub use array_registry::ArrayRegistry;
pub use generational::{GenerationalRegistry, GenerationalRegistryHandle};
pub use handle::HandleType;
pub use hashmap::HashMapRegistry;
pub use trait_registry::{ReadRegistry, Registry, RemovableRegistry, WriteRegistry};
pub use vec_registry::VecRegistry;
