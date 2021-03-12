class DeleteConfig {
    static async event(options, guild) {
        await this.delete(options.database, guild.id);
    }

    static async delete(database, guildID) {
        return Promise.all([
            database.query("DELETE FROM channels WHERE guildid = ?",[guildID]),
            database.query("DELETE FROM guilds WHERE id = ?",[guildID]),
            database.query("DELETE FROM responses WHERE guildid = ?",[guildID]),
            database.query("DELETE FROM badWords WHERE guildid = ?",[guildID]),
            database.query("DELETE FROM moderations WHERE guildid = ?",[guildID])
        ]);
    }
}

module.exports = DeleteConfig;
