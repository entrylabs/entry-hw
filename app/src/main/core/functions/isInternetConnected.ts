import dns from 'dns';

export default (targetHost = 'https://playentry.org/'): Promise<boolean> => new Promise((resolve) => {
    dns.resolve(targetHost, (err) => {
        resolve(!!err);
    });
});
