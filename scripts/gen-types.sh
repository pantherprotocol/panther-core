#!/bin/bash

TYPEDIR=typing

emit_types () {
    local module="$1"
    local outdir=$TYPEDIR/$module
    if [[ -z $force_rebuild ]] && [[ -d $outdir ]]; then
        return
    fi

    mkdir -p $outdir

    yarn tsc --declaration --emitDeclarationOnly --allowjs \
         --outdir $outdir \
         node_modules/$module/{,**/}*.js
}

main () {
    if [[ -n $1 ]]; then
        force_rebuild=yes
    fi

    emit_types circomlibjs
    emit_types blake-hash
    emit_types ffjavascript
    echo "^^^^ Expect an error relating to WasmField1 above; it can be ignored ^^^^"
    if [[ -e $TYPEDIR/ffjavascript/main.d.ts ]]; then
        echo mv $TYPEDIR/ffjavascript/{main,index}.d.ts
        mv $TYPEDIR/ffjavascript/{main,index}.d.ts
    fi
}

main "$@"
