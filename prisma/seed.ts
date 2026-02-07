import {seedSubscriptionPlans} from './seeds/subscription-plans'

async function main() {
    console.log('Seeding subscription plans...')
    await seedSubscriptionPlans()
}
main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        console.log('Seeding finished.')
        process.exit(0)
    })
