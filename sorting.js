// @ts-check

let maxElement = 1;
/**
 * @type {AudioContext | null}
 */
let audioCtx = null;
let isCancelled = false;
let waitTime = 20;
const NUM_ELEMENTS = 50;
/**
 * @type {HTMLCanvasElement | null}
 */
let sortingCanvas = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new window.AudioContext();
  }
}

/**
 *
 * @param {number} value
 * @param {number} maxValue
 * @param {number} duration
 */
function playTone(value, maxValue, duration = waitTime / 2000) {
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  const minFreq = 300;
  const maxFreq = 1500;
  const frequency = minFreq + (value / maxValue) * (maxFreq - minFreq);

  oscillator.frequency.value = frequency;
  oscillator.type = "triangle";

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

/**
 * @param {number[]} list
 * @param {number[]} savedIndexes
 * @param {number[]} checkedIndexes
 * @param {number[]} swappedIndexes
 */
async function updateCanvas(
  list,
  savedIndexes,
  checkedIndexes,
  swappedIndexes,
) {
  if (!sortingCanvas) return;
  const ctx = sortingCanvas.getContext("2d");
  if (!ctx) return;
  const width = sortingCanvas.width;
  const height = sortingCanvas.height;
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  ctx.clearRect(0, 0, width, height);
  for (const idx of swappedIndexes) playTone(list[idx], maxElement);

  const elementWidth = width / list.length;

  for (let i = 0; i < list.length; i++) {
    let elementHeight = (list[i] / maxElement) * height;
    if (swappedIndexes.includes(i)) ctx.fillStyle = "green";
    else if (checkedIndexes.includes(i)) ctx.fillStyle = "blue";
    else if (savedIndexes.includes(i)) ctx.fillStyle = "yellow";
    else ctx.fillStyle = isDarkMode ? "#d0d0d0" : "black";
    ctx.fillRect(
      i * elementWidth,
      height - elementHeight,
      elementWidth,
      elementHeight,
    );
  }
  await new Promise((r) => setTimeout(r, waitTime));
  // hacky way to cancel without checking for flags in all functions
  if (isCancelled) throw new Error("Cancelled");
}

/**
 *
 * @param {number[]} list
 * @returns {Promise<number>}
 */
async function selectionSort(list) {
  await updateCanvas(list, [], [], []);
  let swaps = 0;
  for (let i = 0; i < list.length - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < list.length; j++) {
      await updateCanvas(list, Array.of(minIndex), Array.of(i, j), []);
      if (list[j] < list[minIndex]) minIndex = j;
    }
    if (minIndex !== i) {
      [list[i], list[minIndex]] = [list[minIndex], list[i]];
      swaps++;
    }
    await updateCanvas(list, [], [], Array.of(i, minIndex));
  }
  return swaps;
}

/**
 *
 * @param {number[]} list
 * @returns {Promise<number>}
 */
async function heapSort(list) {
  let swaps = 0;
  const n = list.length;
  await updateCanvas(list, [], [], []);
  /**
   *
   * @param {number} heapSize
   * @param {number} rootIndex
   */
  async function heapify(heapSize, rootIndex) {
    let largest = rootIndex;
    const left = 2 * rootIndex + 1;
    const right = 2 * rootIndex + 2;
    if (left < heapSize) {
      await updateCanvas(list, [largest], [rootIndex, left], []);
      if (list[left] > list[largest]) {
        largest = left;
      }
    }
    if (right < heapSize) {
      await updateCanvas(list, [largest], [rootIndex, right], []);
      if (list[right] > list[largest]) {
        largest = right;
      }
    }
    if (largest !== rootIndex) {
      [list[rootIndex], list[largest]] = [list[largest], list[rootIndex]];
      swaps++;
      await updateCanvas(list, [], [], [rootIndex, largest]);
      await heapify(heapSize, largest);
    }
  }
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await heapify(n, i);
  }

  for (let i = n - 1; i > 0; i--) {
    [list[0], list[i]] = [list[i], list[0]];
    swaps++;

    await updateCanvas(list, [i], [], [0, i]);
    await heapify(i, 0);
  }

  return swaps;
}

/**
 *
 * @param {number[]} list
 * @returns {Promise<number>}
 */
async function quickSort(list) {
  let swaps = 0;
  await updateCanvas(list, [], [], []);

  /**
   *
   * @param {number} low
   * @param {number} high
   */
  async function partition(low, high) {
    const pivot = list[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      await updateCanvas(list, [high], [j], []);

      if (list[j] < pivot) {
        i++;
        [list[i], list[j]] = [list[j], list[i]];
        swaps++;
        await updateCanvas(list, [high], [], [i, j]);
      }
    }

    [list[i + 1], list[high]] = [list[high], list[i + 1]];
    swaps++;
    await updateCanvas(list, [], [], [i + 1, high]);

    return i + 1;
  }

  /**
   *
   * @param {number} low
   * @param {number} high
   */
  async function quickSortRecursive(low, high) {
    if (low < high) {
      const pi = await partition(low, high);
      await quickSortRecursive(low, pi - 1);
      await quickSortRecursive(pi + 1, high);
    }
  }

  await quickSortRecursive(0, list.length - 1);
  return swaps;
}

/**
 *
 * @param {number[]} list
 * @returns {Promise<number>}
 */
async function mergeSort(list) {
  let swaps = 0;
  await updateCanvas(list, [], [], []);

  /**
   *
   * @param {number} start
   * @param {number} mid
   * @param {number} end
   */
  async function merge(start, mid, end) {
    const left = list.slice(start, mid);
    const right = list.slice(mid, end);

    let i = 0;
    let j = 0;
    let k = start;

    while (i < left.length && j < right.length) {
      await updateCanvas(
        list,
        Array.from({ length: end - start }, (_, i) => start + i),
        [k],
        [],
      );

      if (left[i] <= right[j]) {
        list[k++] = left[i++];
      } else {
        list[k++] = right[j++];
      }

      swaps++;
      await updateCanvas(
        list,
        Array.from({ length: end - start }, (_, i) => start + i),
        [],
        [k - 1],
      );
    }

    while (i < left.length) {
      list[k++] = left[i++];
      swaps++;
      await updateCanvas(list, [], [], [k - 1]);
    }

    while (j < right.length) {
      list[k++] = right[j++];
      swaps++;
      await updateCanvas(list, [], [], [k - 1]);
    }
  }

  /**
   *
   * @param {number} start
   * @param {number} end
   */
  async function divide(start, end) {
    if (end - start <= 1) return;

    const mid = Math.floor((start + end) / 2);

    await divide(start, mid);
    await divide(mid, end);

    await merge(start, mid, end);
  }

  await divide(0, list.length);

  return swaps;
}

/**
 *
 * @param {string} sortingAlgorithm
 */
async function sortAlgorithm(sortingAlgorithm) {
  let elements = Array.from(
    { length: NUM_ELEMENTS },
    () => Math.random() * NUM_ELEMENTS * 2,
  );
  maxElement = elements.reduce((a, b) => Math.max(a, b), -Infinity);
  let swaps;
  switch (sortingAlgorithm) {
    case "selection":
      swaps = await selectionSort(elements);
      break;
    case "merge":
      swaps = await mergeSort(elements);
      break;
    case "heap":
      swaps = await heapSort(elements);
      break;
    case "quick":
      swaps = await quickSort(elements);
      break;
    default:
      console.log(`Unimplemented algorithm ${sortingAlgorithm}`);
      return;
  }
  console.log(`total swaps: ${swaps}`);
}

let canvas = document.getElementById("sorting-algorithm-canvas");

if (canvas instanceof HTMLCanvasElement) {
  sortingCanvas = canvas;
  let playButton = document.getElementById("sorting-button");
  let sortingAlgorithm = document.getElementById("sorting-algorithm");
  if (
    playButton instanceof HTMLButtonElement &&
    sortingAlgorithm instanceof HTMLSelectElement
  ) {
    playButton.addEventListener("click", async () => {
      initAudio();
      isCancelled = true;
      await new Promise((r) => setTimeout(r, waitTime + 1));
      isCancelled = false;
      try {
        await sortAlgorithm(sortingAlgorithm.value);
      } catch (
        /**
         * @type {any}
         */
        e
      ) {
        if (e.message !== "Cancelled") throw e;
      }
    });
    sortAlgorithm(sortingAlgorithm.value);
  }
}
