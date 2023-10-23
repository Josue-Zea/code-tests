docker run --rm -d -v /home/davidzea654321/cassandra_data:/var/lib/cassandra --name cassandra -p 9042:9042 docker.io/bitnami/cassandra:4.0
docker exec -it cassandra cqlsh --username cassandra --password cassandra
docker run --rm -d -v /root/cassandra-data:/var/lib/cassandra --name cassandra -p 9042:9042 cassandra
docker exec -it cassandra cqlsh

drop table name;

CREATE KEYSPACE files WITH replication = {'class':'SimpleStrategy', 'replication_factor' : 1};
CREATE TABLE files.documentos (
  id text PRIMARY KEY,
  name text,
  size bigint
);

CREATE TABLE files.pdfs (
  id_pdf text,
  chunk int,
  data blob,
  PRIMARY KEY (id_pdf, chunk)
);

/* install docker */
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo groupadd docker

sudo usermod -aG docker $USER