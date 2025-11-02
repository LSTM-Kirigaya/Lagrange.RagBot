import { getNewsFromTowardsScience } from "../service/qq-daily-news";

async function main() {
    const res = await getNewsFromTowardsScience();
}

main();