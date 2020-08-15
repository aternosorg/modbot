const config = require('../config');

//saves the config for each guild
class guildConfig {
    constructor(id, json) {
        //guild ID
        this.id = id;

        if (json) {
          //log channel
          this.logChannel = json.logChannel;
          //muted role
          this.mutedRole = json.mutedRole;
          //moderator roles
          this.modRoles = json.modRoles;
          //protected roles
          this.protectedRoles = json.protectedRoles;
          //protected roles
          this.punishments = json.punishments;
          //playlist ID
          this.playlist = json.playlist;
          //zendesk helpcenter subdomain
          this.helpcenter = json.helpcenter;
          //allow invites
          this.invites = json.invites;
          //cooldown on links (in s)
          this.linkCooldown = json.linkCooldown;
          //prefix
          this.prefix = json.prefix;
        }

        if (!this.punishments) {
          this.punishments = {};
        }

        if (!this.modRoles) {
          this.modRoles = [];
        }

        if (!this.prefix) {
          this.prefix = config.prefix;
        }
    }

    isModRole(role) {
      return this.modRoles.includes(role);
    }

    addModRole(role) {
      this.modRoles.push(role);
    }

    removeModRole(role) {
      let newRoles = [];
      for (let modRole of this.modRoles) {
        if (modRole != role)
          newRoles.push(modRole);
      }
      this.modRoles = newRoles;
    }

    hasProtectedRole(role) {
      if (!this.protectedRoles)
        this.protectedRoles = [];
      return this.protectedRoles.includes(role);
    }

    addProtectedRole(role) {
      if (!this.protectedRoles)
        this.protectedRoles = [];
      this.protectedRoles.push(role);
    }

    removeProtectedRole(role) {
      if (!this.protectedRoles)
        return;
      let newRoles = [];
      for (let protectedRole of this.protectedRoles) {
        if (protectedRole != role)
          newRoles.push(protectedRole);
      }
      this.protectedRoles = newRoles;
    }

}

module.exports = guildConfig;
