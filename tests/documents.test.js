const { selectVariant, routeDownload } = require('../lib/pdfRouter');

// These tests verify that the correct PDF generator function and legal document
// metadata are selected for every combination of entity (3) × leave type (3).
// They test lib/pdfRouter.js, which mirrors the routing logic in script.js
// downloadPDF() / downloadPdfFbih() / downloadPdfRs() / downloadPdfBrcko().

// ---------------------------------------------------------------------------
describe('FBiH document routing', () => {
    it('1. FBiH + annual leave → downloadPdfFbih, annual title, FBiH legal reference', () => {
        const v = selectVariant('fbih', 'annual');

        expect(v.downloadFn).toBe('downloadPdfFbih');
        expect(v.title).toBe('Rješenje o korištenju godišnjeg odmora');
        expect(v.legalRef).toContain('Zakon o radu FBiH');
    });

    it('2. FBiH + paid leave (sick) → downloadPdfFbih, paid leave title, FBiH legal reference', () => {
        const v = selectVariant('fbih', 'sick');

        expect(v.downloadFn).toBe('downloadPdfFbih');
        expect(v.title).toBe('Rješenje o plaćenom odsustvu');
        expect(v.legalRef).toContain('Zakon o radu FBiH');
    });

    it('3. FBiH + unpaid leave (other) → downloadPdfFbih, unpaid leave title, FBiH legal reference', () => {
        const v = selectVariant('fbih', 'other');

        expect(v.downloadFn).toBe('downloadPdfFbih');
        expect(v.title).toBe('Rješenje o neplaćenom odsustvu');
        expect(v.legalRef).toContain('Zakon o radu FBiH');
    });
});

// ---------------------------------------------------------------------------
describe('RS document routing', () => {
    it('4. RS + annual leave → downloadPdfRs, annual title, RS legal reference', () => {
        const v = selectVariant('rs', 'annual');

        expect(v.downloadFn).toBe('downloadPdfRs');
        expect(v.title).toBe('Rešenje o korišćenju godišnjeg odmora');
        expect(v.legalRef).toContain('Zakon o radu RS');
    });

    it('5. RS + paid leave (sick) → downloadPdfRs, paid leave title, RS legal reference', () => {
        const v = selectVariant('rs', 'sick');

        expect(v.downloadFn).toBe('downloadPdfRs');
        expect(v.title).toBe('Rešenje o plaćenom odsustvu');
        expect(v.legalRef).toContain('Zakon o radu RS');
    });

    it('6. RS + unpaid leave (other) → downloadPdfRs, unpaid leave title, RS legal reference', () => {
        const v = selectVariant('rs', 'other');

        expect(v.downloadFn).toBe('downloadPdfRs');
        expect(v.title).toBe('Rešenje o neplaćenom odsustvu');
        expect(v.legalRef).toContain('Zakon o radu RS');
    });
});

// ---------------------------------------------------------------------------
describe('Brčko Distrikt document routing', () => {
    it('7. Brčko + annual leave → downloadPdfBrcko, annual zahtjev title, Brčko legal reference', () => {
        const v = selectVariant('brcko', 'annual');

        expect(v.downloadFn).toBe('downloadPdfBrcko');
        expect(v.title).toBe('Zahtjev za godišnji odmor');
        expect(v.legalRef).toContain('Zakon o radu Brčko Distrikta');
    });

    it('8. Brčko + paid leave (sick) → downloadPdfBrcko, paid leave zahtjev title', () => {
        const v = selectVariant('brcko', 'sick');

        expect(v.downloadFn).toBe('downloadPdfBrcko');
        expect(v.title).toBe('Zahtjev za plaćeno odsustvo');
        expect(v.legalRef).toContain('Zakon o radu Brčko Distrikta');
    });

    it('9. Brčko + unpaid leave (other) → downloadPdfBrcko, unpaid leave zahtjev title', () => {
        const v = selectVariant('brcko', 'other');

        expect(v.downloadFn).toBe('downloadPdfBrcko');
        expect(v.title).toBe('Zahtjev za neplaćeno odsustvo');
        expect(v.legalRef).toContain('Zakon o radu Brčko Distrikta');
    });
});

// ---------------------------------------------------------------------------
describe('Entity-level routing callbacks (mirrors downloadPDF() branch logic)', () => {
    it('10. FBiH entity routes to the onFbih callback exclusively', () => {
        const onFbih = jest.fn(), onRs = jest.fn(), onBrcko = jest.fn();

        routeDownload('fbih', { onFbih, onRs, onBrcko });

        expect(onFbih).toHaveBeenCalledTimes(1);
        expect(onRs).not.toHaveBeenCalled();
        expect(onBrcko).not.toHaveBeenCalled();
    });

    it('11. RS entity routes to the onRs callback exclusively', () => {
        const onFbih = jest.fn(), onRs = jest.fn(), onBrcko = jest.fn();

        routeDownload('rs', { onFbih, onRs, onBrcko });

        expect(onRs).toHaveBeenCalledTimes(1);
        expect(onFbih).not.toHaveBeenCalled();
        expect(onBrcko).not.toHaveBeenCalled();
    });

    it('12. Brčko entity routes to the onBrcko callback exclusively', () => {
        const onFbih = jest.fn(), onRs = jest.fn(), onBrcko = jest.fn();

        routeDownload('brcko', { onFbih, onRs, onBrcko });

        expect(onBrcko).toHaveBeenCalledTimes(1);
        expect(onFbih).not.toHaveBeenCalled();
        expect(onRs).not.toHaveBeenCalled();
    });
});
