// Maps entity + leave type → the correct PDF download function and document metadata.
// Mirrors the routing logic in script.js downloadPDF() / downloadPdfFbih/Rs/Brcko().
const VARIANTS = {
    fbih: {
        annual: {
            downloadFn: 'downloadPdfFbih',
            title: 'Rješenje o korištenju godišnjeg odmora',
            legalRef: 'Zakon o radu FBiH (Sl. novine FBiH, br. 26/16 i 89/18)'
        },
        sick: {
            downloadFn: 'downloadPdfFbih',
            title: 'Rješenje o plaćenom odsustvu',
            legalRef: 'Zakon o radu FBiH (Sl. novine FBiH, br. 26/16 i 89/18)'
        },
        other: {
            downloadFn: 'downloadPdfFbih',
            title: 'Rješenje o neplaćenom odsustvu',
            legalRef: 'Zakon o radu FBiH (Sl. novine FBiH, br. 26/16 i 89/18)'
        }
    },
    rs: {
        annual: {
            downloadFn: 'downloadPdfRs',
            title: 'Rešenje o korišćenju godišnjeg odmora',
            legalRef: 'Zakon o radu RS (Sl. glasnik RS, br. 24/2005, 61/2005, 54/2009, 32/2013 i 75/2014)'
        },
        sick: {
            downloadFn: 'downloadPdfRs',
            title: 'Rešenje o plaćenom odsustvu',
            legalRef: 'Zakon o radu RS (Sl. glasnik RS, br. 24/2005, 61/2005, 54/2009, 32/2013 i 75/2014)'
        },
        other: {
            downloadFn: 'downloadPdfRs',
            title: 'Rešenje o neplaćenom odsustvu',
            legalRef: 'Zakon o radu RS (Sl. glasnik RS, br. 24/2005, 61/2005, 54/2009, 32/2013 i 75/2014)'
        }
    },
    brcko: {
        annual: {
            downloadFn: 'downloadPdfBrcko',
            title: 'Zahtjev za godišnji odmor',
            legalRef: 'Zakon o radu Brčko Distrikta'
        },
        sick: {
            downloadFn: 'downloadPdfBrcko',
            title: 'Zahtjev za plaćeno odsustvo',
            legalRef: 'Zakon o radu Brčko Distrikta'
        },
        other: {
            downloadFn: 'downloadPdfBrcko',
            title: 'Zahtjev za neplaćeno odsustvo',
            legalRef: 'Zakon o radu Brčko Distrikta'
        }
    }
};

function selectVariant(entity, leaveType) {
    const entityMap = VARIANTS[entity] || VARIANTS.fbih;
    return entityMap[leaveType] || entityMap.annual;
}

// Mirrors downloadPDF() routing: brcko → onBrcko, rs → onRs, else → onFbih
function routeDownload(entity, { onFbih, onRs, onBrcko }) {
    if (entity === 'brcko') return onBrcko();
    if (entity === 'rs') return onRs();
    return onFbih();
}

module.exports = { selectVariant, routeDownload, VARIANTS };
