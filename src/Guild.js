class Guild {

    /**
     *
     * @param {module:"discord.js".Guild}       guild
     * @param {module:"discord.js".Snowflake}   id
     * @return {Promise<null|module:"discord.js".GuildMember>}
     */
    static async fetchMember(guild, id) {
        try {
            return await guild.members.fetch(id);
        }
        catch (e) {
            if (e.code === 10007) {
                throw null;
            }
            else {
                throw e;
            }
        }
    }
}

module.exports = Guild;
