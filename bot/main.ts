import * as fs from 'fs';

import lagServer from './context';
import './impl';

const buffer = fs.readFileSync('./app/publish/appsettings.json', 'utf-8');
const config = JSON.parse(buffer);
const impl = config.Implementations[0];

lagServer.run({
    host: impl.Host,
    port: impl.Port,
    path: impl.Suffix
});