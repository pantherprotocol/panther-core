import {message, danger, warn} from 'danger';
import commitlint, {
    CommitlintPluginConfig,
} from 'danger-plugin-conventional-commitlint';
import {rules} from './commitlint.config';

const mr = danger.gitlab.mr;
const method = mr.title.includes('Draft') ? warn : fail;

function markdonifyFiles(files: string[], mark: string): string {
    if (files.length === 0) {
        return '';
    }
    return `<br />- ${mark} ` + files.join(`<br /> - ${mark} `);
}

const editedMD = markdonifyFiles(danger.git.modified_files, 'MMM');
const createdMD = markdonifyFiles(danger.git.created_files, '+++');
const deletedMD = markdonifyFiles(danger.git.deleted_files, '---');
message('Changed files in this PR:' + editedMD + createdMD + deletedMD);

if (!mr.assignee) {
    warn(
        'This pull request needs an assignee, and optionally include a reviewer',
    );
}

if (mr.description.length < 10) {
    method('This merge request needs a description.');
}

const hasPackageChanges =
    danger.git.modified_files.indexOf('package.json') > -1;
const hasLockfileChanges = danger.git.modified_files.indexOf('yarn.lock') > -1;
if (hasPackageChanges && !hasLockfileChanges) {
    warn(
        'There are package.json changes with no corresponding lockfile changes',
    );
}

(async function dangerReport() {
    const commitlintConfig: CommitlintPluginConfig = {
        severity: mr.title.includes('Draft') ? 'warn' : 'fail',
    };
    // @ts-ignore
    await commitlint(rules, commitlintConfig);
})();

const commits = danger.gitlab.commits;
if (commits.length > 5) {
    warn(
        'There are more than 5 commits in this merge request. Consider splitting into several MRs. This will make the review process much easier',
    );
}

const modifiedFilesCount =
    danger.git.modified_files.length + danger.git.created_files.length;
if (modifiedFilesCount > 20) {
    warn(
        'There are more than 20 files changed in this merge request. Consider splitting into several MRs. This will make the review process much easier',
    );
}

for (const commit of commits) {
    if (!commit.message.includes('Issue-URL')) {
        warn(
            `There is a problem with the commit message > ${commit.title} <br />` +
                '      - Issue-URL is missing. Please consider adding one',
        );
    }
}

for (const commit of commits) {
    if (commit.title.includes('docs')) {
        message(
            `We love documentation! Thanks for adding some, ${commit.author_name}!`,
        );
        break;
    }
}

function fileIsTest(fileName: string): boolean {
    return (
        fileName.includes('test') ||
        fileName.includes('spec') ||
        fileName.includes('stories')
    );
}

if (danger.git.created_files.some(fileIsTest)) {
    message(`We love tests! Thanks for adding some, ${mr.author.name}!`);
} else {
    warn(`No tests were added. Consider adding some`);
}
