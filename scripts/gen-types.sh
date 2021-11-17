#!/bin/bash

TYPEDIR=typing

emit_types() {
    local module="$1"
    local outdir=$TYPEDIR/$module
    if [[ -z $force_rebuild ]] && [[ -d $outdir ]]; then
        return
    fi

    mkdir -p $outdir

    yarn tsc --declaration --emitDeclarationOnly --allowjs \
        --outdir $outdir \
        ../node_modules/$module/{,**/}*.js
}

main() {
    if [[ -n $1 ]]; then
        force_rebuild=yes
    fi

    emit_types circomlibjs
}

main "$@"
