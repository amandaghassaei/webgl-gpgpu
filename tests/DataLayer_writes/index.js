const { setFloat16, getFloat16 } = float16;

const SUCCESS = 'success';
const ERROR = 'error';
const WARNING = 'warning';

requirejs([
	'../../dist/index',
	'../deps/micromodal.min',
], (
	{ GLCompute, HALF_FLOAT, FLOAT, UNSIGNED_BYTE, BYTE, UNSIGNED_SHORT, SHORT, UNSIGNED_INT, INT, GLSL3, GLSL1, CLAMP_TO_EDGE, REPEAT, MIRROR_REPEAT, NEAREST, LINEAR },
	MicroModal,
) => {
	const canvas = document.getElementById('glcanvas');
	MicroModal.init();

	// General code for testing array writes.
	function testArrayWrites(options) {

		const { 
			TYPE,
			DIM_X,
			DIM_Y,
			NUM_ELEMENTS,
			GLSL_VERSION,
			WRAP,
			FILTER,
		} = options;

		const config = {
			readwrite: true,
			type: TYPE,
			dimensions: `[${DIM_X}, ${DIM_Y}]`,
			num_channels: NUM_ELEMENTS,
			wrap: WRAP,
			filter: FILTER,
		};

		try {
			const glcompute = new GLCompute({
				canvas,
				antialias: true,
				glslVersion: GLSL_VERSION,
			});
			config.webgl_version = glcompute.isWebGL2() ? 'WebGL 2' : 'WebGL 1';
			config.glsl_version = GLSL_VERSION === GLSL1 ? 'glsl 1' : 'glsl 3';

			let input;
			let NUM_EXTREMA = 0;
			let NUM_TYPE_EXTREMA = 0;
			let NUM_HALF_FLOAT_INT_EXTREMA = 0;
			let NUM_FLOAT_INT_EXTREMA = 0;

			const MIN_UNSIGNED_INT = 0;
			const MIN_BYTE = -(2 ** 7);
			const MAX_BYTE = 2 ** 8 - 1;
			const MIN_SHORT = -(2 ** 15);
			const MAX_SHORT = 2 ** 16 - 1;
			const MIN_INT = -(2 ** 31);
			const MAX_INT = 2 ** 31 - 1;
			const MIN_FLOAT_INT = -16777216;
			const MAX_FLOAT_INT = 16777216;
			const MIN_HALF_FLOAT_INT = -2048;
			const MAX_HALF_FLOAT_INT = -2048;

			switch (TYPE) {
				case HALF_FLOAT: {
					input = new Float32Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with float data.
					const uint16Array = new Uint16Array(1);
					const view = new DataView(uint16Array.buffer);
					for (let i = 0; i < input.length; i++) {
						const float32Value = (i - input.length / 2) * 0.1;
						// We need to make sure we use a valid float16 value.
						setFloat16(view, 0, float32Value, true);
						input[i] = getFloat16(view, 0, true);
					}
					// Test extrema values.
					NUM_EXTREMA = 4;
					// https://en.wikipedia.org/wiki/Half-precision_floating-point_format
					// Minimum positive value.
					input[0] = 2 ** -24;
					// Minimum negative value.
					input[1] = -input[0];
					// Maximum positive value.
					input[2] = (2 - 2 ** -10) * 2 ** 15;
					// Maximum negative value.
					input[3] = -input[2];
					break;
				}
				case FLOAT: {
					input = new Float32Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with float data.
					for (let i = 0; i < input.length; i++) {
						input[i] = (i - input.length / 2) * 0.1;
					}
					// Test extrema values.
					NUM_EXTREMA = 4;
					// https://en.wikipedia.org/wiki/Single-precision_floating-point_format
					// Minimum positive value.
					input[0] = 2 ** -126;
					// Minimum negative value.
					input[1] = -input[0];
					// Maximum positive value.
					input[2] = (2 - 2 ** -23) * 2 ** 127;
					// Maximum negative value.
					input[3] = -input[2];
					break;
				}
				case UNSIGNED_BYTE: {
					input = new Uint8Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with uint8 data.
					// Test extrema values.
					NUM_TYPE_EXTREMA = 4;
					NUM_EXTREMA = NUM_TYPE_EXTREMA;
					// Minimum values.
					input[0] = MIN_UNSIGNED_INT;
					input[1] = input[0] + 1;
					// Maximum values.
					input[2] = MAX_BYTE;
					input[3] = input[2] - 1;

					const length = input.length - NUM_EXTREMA;
					for (let i = 0; i < length; i++) {
						input[i + NUM_EXTREMA] = i;
					}
					break;
				}
				case UNSIGNED_SHORT: {
					input = new Uint16Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with uint16 data.					
					// Test extrema values.
					NUM_TYPE_EXTREMA = 4;
					NUM_HALF_FLOAT_INT_EXTREMA = 2;
					NUM_EXTREMA = NUM_TYPE_EXTREMA + NUM_HALF_FLOAT_INT_EXTREMA;
					// Minimum values.
					input[0] = MIN_UNSIGNED_INT;
					input[1] = input[0] + 1;
					// Maximum values.
					input[2] = MAX_SHORT;
					input[3] = input[2] - 1;
					// Check that at least half float values are supported.
					input[4] = MAX_HALF_FLOAT_INT;
					input[5] = input[4] - 1;

					const length = input.length - NUM_EXTREMA;
					for (let i = 0; i < length; i++) {
						input[i + NUM_EXTREMA] = i;
					}
					break;
				}
				case UNSIGNED_INT: {
					input = new Uint32Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with uint32 data.
					// Test extrema values.
					NUM_TYPE_EXTREMA = 4;
					NUM_FLOAT_INT_EXTREMA = 2;
					NUM_HALF_FLOAT_INT_EXTREMA = 2;
					NUM_EXTREMA = NUM_TYPE_EXTREMA + NUM_HALF_FLOAT_INT_EXTREMA + NUM_FLOAT_INT_EXTREMA;
					// Minimum values.
					input[0] = MIN_UNSIGNED_INT;
					input[1] = input[0] + 1;
					// Maximum values.
					input[2] = MAX_INT;
					input[3] = input[2] - 1;
					// Check that at least float values are supported.
					input[4] = MAX_FLOAT_INT;
					input[5] = input[4] - 1;
					// Check that at least half float values are supported.
					input[6] = MAX_HALF_FLOAT_INT;
					input[7] = input[4] - 1;

					const length = input.length - NUM_EXTREMA;
					for (let i = 0; i < length; i++) {
						input[i + NUM_EXTREMA] = i;
					}
					break;
				}
				case BYTE: {
					input = new Int8Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with int8 data.
					// Test extrema values.
					NUM_TYPE_EXTREMA = 4;
					NUM_EXTREMA = NUM_TYPE_EXTREMA;
					// Minimum values.
					input[0] = MIN_BYTE;
					input[1] = input[0] + 1;
					// Maximum values.
					input[2] = MAX_BYTE;
					input[3] = input[2] - 1;

					const length = input.length - NUM_EXTREMA;
					for (let i = 0; i < length; i++) {
						input[i + NUM_EXTREMA] = (i - Math.floor(length / 2));
					}
					break;
				}
				case SHORT: {
					input = new Int16Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with int16 data.
					// Test extrema values.
					NUM_TYPE_EXTREMA = 4;
					NUM_HALF_FLOAT_INT_EXTREMA = 4;
					NUM_EXTREMA = NUM_TYPE_EXTREMA + NUM_HALF_FLOAT_INT_EXTREMA;
					// Minimum values.
					input[0] = MIN_SHORT;
					input[1] = input[0] + 1;
					// Maximum values.
					input[2] = MAX_SHORT;
					input[3] = input[2] - 1;
					// Check that at least half float values are supported.
					input[4] = MIN_HALF_FLOAT_INT;
					input[5] = input[4] + 1;
					input[6] = MAX_HALF_FLOAT_INT;
					input[7] = input[6] - 1;

					const length = input.length - NUM_EXTREMA;
					for (let i = 0; i < length; i++) {
						input[i + NUM_EXTREMA] = (i - Math.floor(length / 2));
					}
					break;
				}
				case INT: {
					input = new Int32Array(DIM_X * DIM_Y * NUM_ELEMENTS);
					// Fill with int32 data.
					// Test extrema values.
					NUM_TYPE_EXTREMA = 4;
					NUM_FLOAT_INT_EXTREMA = 4;
					NUM_HALF_FLOAT_INT_EXTREMA = 4;
					NUM_EXTREMA = NUM_TYPE_EXTREMA + NUM_HALF_FLOAT_INT_EXTREMA + NUM_FLOAT_INT_EXTREMA;
					// Minimum values.
					input[0] = MIN_INT;
					input[1] = input[0] + 1;
					// Maximum values.
					input[2] = MAX_INT;
					input[3] = input[2] - 1;
					// Check that at least float values are supported.
					input[4] = MIN_FLOAT_INT;
					input[5] = input[4] + 1;
					input[6] = MAX_FLOAT_INT;
					input[7] = input[6] - 1;
					// Check that at least half float values are supported.
					input[8] = MIN_HALF_FLOAT_INT;
					input[9] = input[8] + 1;
					input[10] = MAX_HALF_FLOAT_INT;
					input[11] = input[10] - 1;

					const length = input.length - NUM_EXTREMA;
					for (let i = 0; i < length; i++) {
						input[i + NUM_EXTREMA] = (i - Math.floor(length / 2));
					}
					break;
				}
				default:
					throw new Error(`Invalid type ${TYPE}.`);
			}

			const dataLayer = glcompute.initDataLayer(
				{
					name: `test-${TYPE}`,
					dimensions: [DIM_X, DIM_Y],
					type: TYPE,
					numComponents: NUM_ELEMENTS,
					data: input,
					filter: FILTER,
					wrapS: WRAP,
					wrapT: WRAP,
					writable: true,
					numBuffers: 2,
				},
			);

			const copyProgram = glcompute.copyProgramForType(TYPE);

			glcompute.step(copyProgram, [dataLayer], dataLayer);
			const output = glcompute.getValues(dataLayer);

			glcompute.destroy();

			let status = SUCCESS;
			const error = [];
			const log = [];
			const typeMismatch =  TYPE !== dataLayer.internalType;
			if (typeMismatch) {
				log.push(`Unsupported type ${TYPE} for the current configuration, using type ${dataLayer.internalType} internally.`);
			}
			if (WRAP !== dataLayer.internalWrapS || WRAP !== dataLayer.internalWrapT) {
				error.push(`Unsupported boundary wrap ${WRAP} for the current configuration, using wrap [${dataLayer.internalWrapS}, ${dataLayer.internalWrapT}] internally with software polyfill.`);
			}
			if (glcompute.gl[FILTER] !== dataLayer.glFilter) {
				const filter = dataLayer.glFilter === glcompute.gl[NEAREST] ? NEAREST : LINEAR;
				error.push(`Unsupported interpolation filter ${FILTER} for the current configuration, using filter ${filter} internally with software polyfill.`);
			}

			// Compare input and output.
			if (input.length !== output.length) {
				status = ERROR;
				error.push(`Input and output arrays have unequal length: expected length ${input.length}, got length ${output.length}.`);
				return {
					status,
					log,
					error,
					config,
				};
			}
			let numMismatches = 0;
			let typeExtremaSupported = true;
			let floatExtremaSupported = true;
			let halfFloatExtremaSupported = true;
			for (let i = 0; i < input.length; i++) {
				if (input[i] !== output[i]) {
					if (i < NUM_TYPE_EXTREMA) {
						typeExtremaSupported = false;
					} else if (i < NUM_TYPE_EXTREMA + NUM_FLOAT_INT_EXTREMA) {
						floatExtremaSupported = false;
					} else if (i < NUM_TYPE_EXTREMA + NUM_FLOAT_INT_EXTREMA + NUM_HALF_FLOAT_INT_EXTREMA) {
						halfFloatExtremaSupported = false;
					} else {
						numMismatches++;
					}
				}
			}
			
			if (numMismatches === input.length) {
				status = ERROR;
				error.push(`All elements of output array do not match input values.`);
				return {
					status,
					log,
					error,
					config,
				};
			}

			const extremaSupported = typeExtremaSupported && floatExtremaSupported && halfFloatExtremaSupported;
			if (
				numMismatches || // Any (non-extrema) mismatches found.
				!halfFloatExtremaSupported || // Half float extrema should always be supported.
				(!floatExtremaSupported && dataLayer.internalType !== HALF_FLOAT) || // Float extrema should always be supported unless using half float type.
				(!extremaSupported && !typeMismatch) // Extrema should be supported if using correct internal type.
			) {
				status = ERROR;
				error.push(`Input and output arrays contain mismatched elements.`);
				return {
					status,
					log,
					error,
					config,
				};
			}
			
			// Check int support.
			if (
				typeMismatch &&
				(TYPE === UNSIGNED_BYTE || TYPE === BYTE || TYPE === UNSIGNED_SHORT || TYPE === SHORT || TYPE === UNSIGNED_INT || TYPE === INT) &&
				!typeExtremaSupported
			) {
				let min = MIN_HALF_FLOAT_INT;
				let max = MAX_HALF_FLOAT_INT;
				if (dataLayer.internalType === FLOAT) {
					min = MIN_FLOAT_INT;
					max = MAX_FLOAT_INT;
				}
				status = WARNING;
				error.push(`Internal data type ${dataLayer.internalType} supports integers in range ${min.toLocaleString("en-US")} to ${max.toLocaleString("en-US")}.  Current type ${TYPE} contains integers in range ${input[0].toLocaleString("en-US")} to ${input[2].toLocaleString("en-US")}.`);
			}

			return {
				status,
				log,
				error,
				config,
			};
		} catch (error) {
			return {
				status: ERROR,
				error: [error.message],
				config,
			};
		}
	}

	function showMoreInfo(e, result) {
		e.preventDefault();
		const modal = document.getElementById('modal-1-container');
		modal.className = `${result.status} modal__container`;
		document.getElementById('modal-1-title').innerHTML = result.status;
		document.getElementById('modal-1-error').innerHTML = `${result.log.length ? result.log.join('<br/><br/>') + '<br/><br/>' : ''} ${result.error.join('<br/><br/>')}`;
		document.getElementById('modal-1-config').innerHTML = Object.keys(result.config).map(key => `${key}: ${result.config[key]}`).join('<br/>');
		MicroModal.show('modal-1');
	}

	function makeTitleColumn(titles, title) {
		const container = document.createElement('div');
		container.className = 'column-title';
		if (title) {
			const titleDiv = document.createElement('div');
			titleDiv.className = 'entry';
			titleDiv.innerHTML = title;
			container.appendChild(titleDiv);
		}
		titles.forEach(title => {
			const titleDiv = document.createElement('div');
			titleDiv.className = 'entry';
			titleDiv.innerHTML = title;
			container.appendChild(titleDiv);
		});
		return container;
	}

	function makeColumn(results, title) {
		const container = document.createElement('div');
		container.className = 'column';
		const titleDiv = document.createElement('div');
		titleDiv.className = 'entry header';
		titleDiv.innerHTML = title;
		container.appendChild(titleDiv);
		results.forEach(result => {
			const element = document.createElement('div');
			element.className = `entry result ${result.status}`;
			if (result.status === SUCCESS) {
				element.innerHTML = `&#10003;${result.error.length ? '*' : ''}`;
			} else {
				if (result.status === WARNING) {
					element.innerHTML = '!'
				} else if (result.status === ERROR) {
					element.innerHTML = 'X'
				}
			}
			const link = document.createElement('a');
			link.href = '#';
			link.onclick = (e) => showMoreInfo(e, result);
			link.appendChild(element);
			container.appendChild(link);
		});
		return container;
	}

	function makeTable(testFunction) {
		// To make things simpler, keep DIM_X * DIMY < 256.
		const DIM_X = 10;
		const DIM_Y = 10;
	
		const output = document.getElementById('output');
	
		const types = [
			HALF_FLOAT,
			FLOAT,
			UNSIGNED_BYTE,
			BYTE,
			UNSIGNED_SHORT,
			SHORT,
			UNSIGNED_INT,
			INT,
		];
		types.forEach((TYPE) => {
			// Create place to show results.
			const div = document.createElement('div');
			output.appendChild(div);
	
			// Make vertical label displaying type.
			const label = document.createElement('div');
			label.className = 'label';
			const labelInner = document.createElement('div');
			labelInner.className = 'rotate bold';
			labelInner.innerHTML = TYPE;
			label.appendChild(labelInner);
			div.appendChild(label);
	
			// Container for table.
			const container = document.createElement('div');
			container.className = 'container';
			div.appendChild(container);
	
			const rowTitles = ['R', 'RG', 'RGB', 'RGBA'];
			container.appendChild(makeTitleColumn(rowTitles));
	
			// Loop through each glsl version.
			const glslversions = [GLSL1, GLSL3];
			glslversions.forEach(GLSL_VERSION => {
	
				const outerTable = document.createElement('div');
				outerTable.className="outerTable"
				container.appendChild(outerTable);
				const outerTableTitle = document.createElement('div');
				outerTableTitle.className="outerTable-title entry"
				outerTableTitle.innerHTML = `GLSL v${GLSL_VERSION === GLSL1 ? '1' : '3'}`;
				outerTable.appendChild(outerTableTitle);
	
				// Loop through various settings.
				const defaultResults = [];
				for (let NUM_ELEMENTS = 1; NUM_ELEMENTS <= 4; NUM_ELEMENTS++) {
					// Test array writes for type.
					defaultResults.push(testFunction({
						TYPE,
						DIM_X,
						DIM_Y,
						NUM_ELEMENTS,
						GLSL_VERSION,
						WRAP: CLAMP_TO_EDGE,
						FILTER: NEAREST,
					}));
				}
				outerTable.appendChild(makeColumn(defaultResults, '<br/>default'));
	
				const linearResults = [];
				for (let NUM_ELEMENTS = 1; NUM_ELEMENTS <= 4; NUM_ELEMENTS++) {
					// Test array writes for type.
					linearResults.push(testFunction({
						TYPE,
						DIM_X,
						DIM_Y,
						NUM_ELEMENTS,
						GLSL_VERSION,
						WRAP: CLAMP_TO_EDGE,
						FILTER: LINEAR,
					}));
				}
				outerTable.appendChild(makeColumn(linearResults, 'filter<br/>LINEAR'));
	
				const repeatResults = [];
				for (let NUM_ELEMENTS = 1; NUM_ELEMENTS <= 4; NUM_ELEMENTS++) {
					// Test array writes for type.
					repeatResults.push(testFunction({
						TYPE,
						DIM_X,
						DIM_Y,
						NUM_ELEMENTS,
						GLSL_VERSION,
						WRAP: REPEAT,
						FILTER: NEAREST,
					}));
				}
				outerTable.appendChild(makeColumn(repeatResults, 'wrap<br/>REPEAT'));
	
				const linearRepeatResults = [];
				for (let NUM_ELEMENTS = 1; NUM_ELEMENTS <= 4; NUM_ELEMENTS++) {
					// Test array writes for type.
					linearRepeatResults.push(testFunction({
						TYPE,
						DIM_X,
						DIM_Y,
						NUM_ELEMENTS,
						GLSL_VERSION,
						WRAP: REPEAT,
						FILTER: LINEAR,
					}));
				}
				outerTable.appendChild(makeColumn(linearRepeatResults, '<br/>LINEAR / REPEAT'));
			});
	
			container.appendChild(document.createElement('br'));
		});
	}

	makeTable(testArrayWrites);
});