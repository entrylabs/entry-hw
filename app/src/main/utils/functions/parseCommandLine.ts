import { merge } from 'lodash';

/**
 * 커맨드라인 값으로 허용할 형태
 * flag 의 경우는 이후 붙을 값 없이 해당 키가 존재하면 적용된다.
 * pair 의 경우는 키가 나오면, 그다음은 값이 있어야 한다.
 * 그렇지 않을 경우 다음 pair 체크로 넘어간다.
 *
 * pair 값의 첫 인덱스는 실제 값, 그다음부터는 alias 이다.
 * 실제 값의 경우는 -- 가 붙어야 하며, alias 는 - 만 붙는다.
 *
 * 모든 값은 대소문자를 구분한다.
 * 모든 값은 '=' 으로 구분한다.
 */
const properties = {
    flag: [
        ['debug', 'd'],
    ],
    pair: [
        ['version', 'v'],
        ['app'],
        ['host', 'h'],
        ['protocol', 'p'],
        ['config', 'c'],
    ],
};

const flags: CommandLineFlags = {};

const pairs: CommandLinePairs = {};

function parseFlags(key: string) {
    for (let i = 0; i < properties.flag.length; i++) {
        const [fullName, alias] = properties.flag[i];
        if (`--${fullName}` === key || `-${alias}` === key) {
            flags[fullName as keyof CommandLineFlags] = true;
            return;
        }
    }
}

function parsePair(key: string, value: string | boolean) {
    if (!value) {
        return;
    }

    for (let i = 0; i < properties.pair.length; i++) {
        const [fullName, alias] = properties.pair[i];
        if (`--${fullName}` === key || `-${alias}` === key) {
            pairs[fullName as keyof CommandLinePairs] = value;
            return;
        }
    }
}

export default (argv: string[]): CommandLineOptions => {
    for (let i = 0; i < argv.length; i++) {
        const [key, value] = argv[i].split('=');
        parseFlags(key);
        parsePair(key, value);
    }

    return merge(flags, pairs);
};
