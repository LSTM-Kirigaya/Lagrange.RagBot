import { getNewsFromTowardsScience } from "../service/news";

async function main() {
    const res = await getNewsFromTowardsScience();
}

main();