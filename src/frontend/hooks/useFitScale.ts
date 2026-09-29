import {
  useLayoutEffect,
  useState,
} from "react";


interface FitScaleResult {
  scale: number;
  width: number;
  height: number;
}


interface FitScaleOptions {
  horizontalPadding?: number;
  verticalPadding?: number;
}


function useFitScale(
  stageRef: React.RefObject<
    HTMLElement | null
  >,
  options: FitScaleOptions = {},
): FitScaleResult {

  const {
    horizontalPadding = 24,
    verticalPadding = 16,
  } = options;


  const [
    result,
    setResult,
  ] = useState<FitScaleResult>({
    scale: 1,
    width: 0,
    height: 0,
  });


  useLayoutEffect(() => {

    const stage =
      stageRef.current;


    if (!stage) {
      return;
    }


    /*
     * =========================================================
     * VIEWPORT
     * =========================================================
     *
     * Stage berada di dalam:
     *
     * .sorting-content-viewport
     *
     * Jadi ukuran yang digunakan untuk scaling harus
     * berdasarkan viewport tersebut, bukan window secara
     * langsung.
     *
     * Dengan cara ini header tidak ikut memengaruhi
     * perhitungan scale.
     */

    const viewport =
      stage.parentElement?.parentElement;


    if (!viewport) {
      return;
    }


    let frame = 0;


    const updateScale =
      () => {

        cancelAnimationFrame(
          frame,
        );


        frame =
          requestAnimationFrame(
            () => {

              /*
               * =================================================
               * NATURAL STAGE SIZE
               * =================================================
               *
               * Stage tetap memiliki ukuran desain asli.
               *
               * Contoh:
               *
               * 1005 × 650
               *
               * Ukuran inilah yang kemudian diperkecil
               * secara proporsional.
               */

              const naturalWidth =
                stage.offsetWidth;


              const naturalHeight =
                stage.offsetHeight;


              if (
                naturalWidth <= 0 ||
                naturalHeight <= 0
              ) {
                return;
              }


              /*
               * =================================================
               * VIEWPORT SIZE
               * =================================================
               */

              const viewportWidth =
                viewport.clientWidth;


              const viewportHeight =
                viewport.clientHeight;


              if (
                viewportWidth <= 0 ||
                viewportHeight <= 0
              ) {
                return;
              }


              /*
               * =================================================
               * AVAILABLE AREA
               * =================================================
               *
               * Padding hanya digunakan untuk memberikan
               * ruang aman di sekitar canvas.
               *
               * Header sudah berada DI LUAR viewport ini,
               * sehingga tidak perlu dikurangi lagi.
               */

              const availableWidth =
                Math.max(
                  1,
                  viewportWidth -
                    horizontalPadding * 2,
                );


              const availableHeight =
                Math.max(
                  1,
                  viewportHeight -
                    verticalPadding * 2,
                );


              /*
               * =================================================
               * SCALE
               * =================================================
               *
               * Gunakan nilai terkecil agar seluruh canvas
               * selalu terlihat.
               *
               * Tidak pernah membesarkan canvas lebih dari
               * ukuran naturalnya.
               */

              const widthScale =
                availableWidth /
                naturalWidth;


              const heightScale =
                availableHeight /
                naturalHeight;


              const nextScale =
                Math.min(
                  1,
                  widthScale,
                  heightScale,
                );


              const safeScale =
                Math.max(
                  nextScale,
                  0.01,
                );


              setResult({
                scale:
                  safeScale,

                width:
                  naturalWidth *
                  safeScale,

                height:
                  naturalHeight *
                  safeScale,
              });

            },
          );
      };


    /*
     * =========================================================
     * INITIAL
     * =========================================================
     */

    updateScale();


    /*
     * =========================================================
     * WINDOW RESIZE
     * =========================================================
     */

    window.addEventListener(
      "resize",
      updateScale,
    );


    /*
     * =========================================================
     * VISUAL VIEWPORT
     * =========================================================
     */

    window.visualViewport?.addEventListener(
      "resize",
      updateScale,
    );


    /*
     * =========================================================
     * RESIZE OBSERVER
     * =========================================================
     *
     * Observe viewport dan stage.
     *
     * Ini penting di Tauri karena ukuran WebView bisa berubah
     * tanpa selalu menghasilkan perubahan layout yang sama
     * seperti browser biasa.
     */

    const resizeObserver =
      new ResizeObserver(
        updateScale,
      );


    resizeObserver.observe(
      viewport,
    );


    resizeObserver.observe(
      stage,
    );


    /*
     * =========================================================
     * FONT READY
     * =========================================================
     */

    if (document.fonts) {

      document.fonts.ready.then(
        updateScale,
      );

    }


    /*
     * =========================================================
     * CLEANUP
     * =========================================================
     */

    return () => {

      cancelAnimationFrame(
        frame,
      );


      window.removeEventListener(
        "resize",
        updateScale,
      );


      window.visualViewport?.removeEventListener(
        "resize",
        updateScale,
      );


      resizeObserver.disconnect();

    };

  }, [
    stageRef,
    horizontalPadding,
    verticalPadding,
  ]);


  return result;
}


export default useFitScale;