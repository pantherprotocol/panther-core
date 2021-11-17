#!/bin/bash

TYPEDIR=typing

emit_types() {
    local module="$1"
    local outdir=$TYPEDIR/$module
    if [[ -z $force_rebuild ]] && [[ -d $outdir ]]; then
        return
    fi

    mkdir -p $outdir

    yarn tsc \
        --declaration \
        --emitDeclarationOnly \
        --esModuleInterop \
        --allowJs \
        --outdir $outdir \
        ../node_modules/$module/{,**/}*.js

    if [[ -e $outdir/main.d.ts ]]; then
        echo mv $outdir/{main,index}.d.ts
        mv $outdir/{main,index}.d.ts
    fi

    echo "Wrote types to $outdir"
}

main() {
    if [[ -n $1 ]]; then
        force_rebuild=yes
    fi

    emit_types circomlibjs
    emit_types blake-hash
    emit_types ffjavascript
    echo "^^^^ If you see an error relating to WasmField1 above; it can be ignored ^^^^"
}

main "$@"
