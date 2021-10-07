import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType } from '@aws-cdk/aws-ec2';
import { Asset } from '@aws-cdk/aws-s3-assets';
import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import { readFileSync } from 'fs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // VPC in CDK wraps igw
    const serverVpc = new ec2.Vpc(this, 'VPC', {
      cidr: '10.0.0.0/24',
      maxAzs: 2,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'Public Subnet',
          cidrMask: 28
        }
      ]
    });

    const serverSecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: serverVpc,
      description: 'Allow ssh and http access to ec2 instances',
      allowAllOutbound: true
    });
    serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow inbound ssh');
    serverSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow http');

    const serverRole = new iam.Role(this, 'webserver-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ]
    });

    const amznLinux = ec2.MachineImage.latestAmazonLinux();
    const bootstrap_script = new Asset(this, 'Asset', {path: path.join(__dirname, 'startserver.sh')});
    const gameServer = new ec2.Instance(this, 'Instance', {
      // ToDo
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      vpc: serverVpc,
      securityGroup: serverSecurityGroup,
      init: ec2.CloudFormationInit.fromConfigSets({
        configSets: {
          default: ['yumPreinstall'],
        },
        configs: {
          yumPreinstall: new ec2.InitConfig([
            // Install git, node, and npm 
            ec2.InitPackage.yum('git')
          ])
        }
      }),
      keyName: process.env.KEYPAIRNAME
    });

    const userDataScript = readFileSync('./startserver.sh', 'utf8');
    gameServer.addUserData(userDataScript);

  }
}
