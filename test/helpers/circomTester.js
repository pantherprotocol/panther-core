const path = require("path");

module.exports = {
    getOptions,
}

function getOptions() {
    const basedir = path.join(__dirname, "../../");
    const options = {
        basedir,
    }
    if (!!process.env.CIRCOM_DOCKER) {
        options.compiler = path.join(basedir, "./scripts/circom-docker.sh");
        options.tmpdir = path.join(basedir, "./compiled/tmp/");
    }
    return options;
}
