When running this website on the WHALE server, these steps were taken as setup:

- Start website itself
    + install forever globally
    + sudo forever start web.js
- Set up data updates
    + WAVE
        * Create a simple bash script for every active cron.<timeslot> folder that exists in /etc/cron.<timeslot> and has


