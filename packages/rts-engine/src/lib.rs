mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = get42)]
pub fn get_42() -> u32 {
    return 42;
}
