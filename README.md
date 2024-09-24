# Unban Manager

A utility bot that scans through server unbans and tracks down ones that shouldn't go through.

# Requirements

- [NodeJS Runtime](https://nodejs.org/)
- [Typescript](https://www.typescriptlang.org/)
- [.env File](https://en.wikipedia.org/wiki/Environment_variable)
- [config.yml File](https://www.freecodecamp.org/news/what-is-yaml-the-yml-file-format/)

For more information on what environment variables need to be set [click here](https://github.com/redicides/unban-manager/blob/main/.env.example), for more information on what global config needs to be set [click here](https://github.com/redicides/unban-manager/blob/main/config.example.yml).

# Running the bot

Ensure that you have properly set up your environment variables and global config. These files must be in the **root** directory of the project, outside of the `src` folder, and must be named `.env` and `config.yml` respectively.

The following permissions **must** be granted in discord for things to work effectively; it is not recommended to give the bot "Administrator":

- Send Messages
- Embed Links
- View Audit Log
- Ban Members

## Initially

- All of the following commands must be ran on the root directory of the project.

1. First and foremost, you must install all of the dependencies. This can be done using the package manager of your choice, but for this example we will be using `npm`. Run `npm install` and wait for it to finish.

2. Next, we'll need to make sure our sqlite database is setup. This can be done by running `npm run db:push`. The command will create a `database.db` file under the `prisma` folder, and that's where the bot will store all of its data.

3. Once the database is setup, we'll need to compile the typescript code into javascript. This can be done by running `npm run build`.

4. Finally, we'll need to start the bot. This can be done by running `npm run start`.

And that's it! You should now have a running instance of the bot.

## Future Times

- To update the source files of this project you can use `git pull` if you cloned this repository using `git clone`.
- If there are any changes to the database schema, you can use `npm run db:push` to update the database to the new schema format.

1. In case the source files have changed, that may mean that additional dependencies have been added. You can install these dependencies by running `npm install` again. Always check the `releases` page as it contains information on what has changed.

2. Once again, in case the source files have changed, you will need to re-compile the typescript code into javascript by running `npm run build`.

3. Finally, you can start the bot again by running `npm run start`.

# Contributing

We welcome contributions from the community! If you've discovered any issues in the code, have ideas for improvements, or want to add a new feature, please feel free to submit a pull request.
However, we encourage you to focus on incremental changes rather than huge new features. This helps ensure the codebase remains maintainable and cohesive.

Please avoid submitting pull requests for the following:

- Formatting: The codebase is automatically formatted using Prettier, so formatting changes are unnecessary.
- Typos: Bringing typos to our attention is appreciated, but please create a new issue or directly contact a developer rather than submitting a pull request.
- Micro performance optimizations: Small performance tweaks are generally not necessary unless they address a specific, identified performance problem.

When contributing, ensure your code is well-commented, formatted using the Prettier settings in the .prettierrc.yml file, and thoroughly tested.

# License

This project is licensed under the Creative Commons 1.0 Universal License. This means that you are free to use, modify, and distribute the project, even for commercial purposes, all without asking for permission.

You can find the full text of the license in the LICENSE file, or [here](https://creativecommons.org/publicdomain/zero/1.0/deed.en).
