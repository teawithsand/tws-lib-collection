use crate::algo::registry::{ReadRegistry, RemovableRegistry, WriteRegistry};

/// A handle to a client in the spatial hash map.
///
/// This can be used to retrieve a Client or ClientMut to access the stored data.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ClientHandle<H>(pub(super) H)
where
    H: Copy + Clone + Eq + std::fmt::Debug;

/// Immutable client reference providing read-only access to spatial hash map data.
///
/// This struct allows reading both the user data (type D) and the shape (type T).
pub struct Client<'a, C, D, T, R, H>
where
    R: ReadRegistry<super::registry::ClientData<D, T>>
        + WriteRegistry<super::registry::ClientData<D, T>>,
    H: Copy + Clone + Eq + std::fmt::Debug,
{
    pub(super) map: &'a super::SpatialHashMap<C, D, T, R>,
    pub(super) handle: ClientHandle<H>,
}

impl<'a, C, D, T, R, H> Client<'a, C, D, T, R, H>
where
    C: super::SpatialHashMapCoord,
    R: ReadRegistry<super::registry::ClientData<D, T>>
        + WriteRegistry<super::registry::ClientData<D, T>>,
    H: Copy + Clone + Eq + std::fmt::Debug,
    <R as ReadRegistry<super::registry::ClientData<D, T>>>::Handle: From<H> + Into<H>,
{
    /// Get a reference to the user data stored with this client.
    pub fn data(&self) -> Option<&D> {
        self.map.get_data(ClientHandle(self.handle.0.into()))
    }

    /// Get a reference to the shape stored with this client.
    pub fn shape(&self) -> Option<&T> {
        self.map.get_shape(ClientHandle(self.handle.0.into()))
    }

    /// Get the handle for this client.
    pub fn handle(&self) -> ClientHandle<H> {
        self.handle
    }
}

/// Mutable client reference providing read-write access to spatial hash map data.
///
/// This struct allows reading/writing the user data (type D), reading the shape (type T),
/// and deleting the entry from the map.
pub struct ClientMut<'a, C, D, T, R, H>
where
    R: ReadRegistry<super::registry::ClientData<D, T>>
        + WriteRegistry<super::registry::ClientData<D, T>>,
    H: Copy + Clone + Eq + std::fmt::Debug,
{
    pub(super) map: &'a mut super::SpatialHashMap<C, D, T, R>,
    pub(super) handle: ClientHandle<H>,
}

impl<'a, C, D, T, R, H> ClientMut<'a, C, D, T, R, H>
where
    C: super::SpatialHashMapCoord,
    R: ReadRegistry<super::registry::ClientData<D, T>>
        + WriteRegistry<super::registry::ClientData<D, T>>,
    H: Copy + Clone + Eq + std::fmt::Debug,
    <R as ReadRegistry<super::registry::ClientData<D, T>>>::Handle: From<H> + Into<H>,
{
    /// Get a reference to the user data stored with this client.
    pub fn data(&self) -> Option<&D> {
        self.map.get_data(ClientHandle(self.handle.0.into()))
    }

    /// Get a mutable reference to the user data stored with this client.
    pub fn data_mut(&mut self) -> Option<&mut D> {
        self.map.get_data_mut(ClientHandle(self.handle.0.into()))
    }

    /// Get a reference to the shape stored with this client.
    pub fn shape(&self) -> Option<&T> {
        self.map.get_shape(ClientHandle(self.handle.0.into()))
    }

    /// Get the handle for this client.
    pub fn handle(&self) -> ClientHandle<H> {
        self.handle
    }
}

impl<'a, C, D, T, R, H> ClientMut<'a, C, D, T, R, H>
where
    C: super::SpatialHashMapCoord + nalgebra::Scalar,
    T: super::insertable::SpatialHashMapShape<C>,
    R: ReadRegistry<super::registry::ClientData<D, T>>
        + WriteRegistry<super::registry::ClientData<D, T>>
        + RemovableRegistry<super::registry::ClientData<D, T>>,
    H: Copy + Clone + Eq + std::fmt::Debug,
    <R as ReadRegistry<super::registry::ClientData<D, T>>>::Handle: From<H> + Into<H>,
    <R as RemovableRegistry<super::registry::ClientData<D, T>>>::Handle:
        From<<R as ReadRegistry<super::registry::ClientData<D, T>>>::Handle>,
    <R as ReadRegistry<super::registry::ClientData<D, T>>>::Handle:
        From<<R as RemovableRegistry<super::registry::ClientData<D, T>>>::Handle>,
{
    /// Remove this client from the spatial hash map.
    ///
    /// Returns the user data if the client was still valid.
    pub fn delete(self) -> Option<D> {
        self.map.remove(ClientHandle(self.handle.0.into()))
    }
}
