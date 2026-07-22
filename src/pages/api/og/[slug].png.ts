import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { getCollection } from 'astro:content';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm?url';
