<p align="center">
  <h3 align="center">DeginxWSS</h3>

  <p align="center">
    A WebSocket transfer server can allow users to send a message through peer-to-peer or peer-to-multiple to other users.
    <br/>
    <br/>
  </p>
![Contributors](https://img.shields.io/github/contributors/jonyandunh/DeginxWSS?color=dark-green) ![Forks](https://img.shields.io/github/forks/jonyandunh/DeginxWSS?style=social) ![Stargazers](https://img.shields.io/github/stars/jonyandunh/DeginxWSS?style=social) ![Issues](https://img.shields.io/github/issues/jonyandunh/DeginxWSS) 

## Table Of Contents

* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Contributing](#contributing)
* [Authors](#authors)
* [Acknowledgements](#acknowledgements)

## Getting Started


### Prerequisites

This is an example of how to list things you need to use the software and how to install them.

* npm

```sh
npm install npm@latest -g
```
* MySQL
```
CREATE DATABASE websocket;

create table uuid_list(
   uuid_md5 VARCHAR(40) NOT NULL,
   key_md5 VARCHAR(40) NOT NULL,
   group_md5 VARCHAR(40) NOT NULL,
   PRIMARY KEY (uuid_md5)
);
```

### Installation

1. Clone the repo

```sh
git clone https://github.com/JonyanDunh/DeginxWSS.git
cd DeginxWSS
```

2. Install NPM packages

```sh
npm install
```

3. Enter your Mysql config in `server.js`

```JS
var connection = mysql.createConnection({
        host: 'localhost',
        user: 'websocket',
        password: 'zs4EPdz3SSRZezWS',
        database: 'websocket'
    });
```
4.Run server
```sh
node server.js
```

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.
* If you have suggestions for adding or removing projects, feel free to [open an issue](https://github.com/jonyandunh/DeginxWSS/issues/new) to discuss it, or directly create a pull request after you edit the *README.md* file with necessary changes.
* Please make sure you check your spelling and grammar.
* Create individual PR for each suggestion.
* Please also read through the [Code Of Conduct](https://github.com/jonyandunh/DeginxWSS/blob/main/CODE_OF_CONDUCT.md) before posting your first idea as well.

### Creating A Pull Request

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Authors

* **Jonyan Dunh** - *A Full Stack developer from China* - [Jonyan Dunh](https://twitter.com/JonyanDunh) - *Whole of the project*

## Acknowledgements

* [Node.js](https://nodejs.org/en/)
* [Npm](https://www.npmjs.com/)
* [Mysql](https://www.mysql.com/)
