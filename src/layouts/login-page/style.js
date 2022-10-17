import styled from 'styled-components';

const Container = styled.div`
  width: 100%; 
  height: 100vh;
  background-color: #FAFAFB;
`;

const SubContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%)
`;

const Error = styled.div`
  margin-bottom: 10px; 
  color: #F10B45;
`;

const Message = styled.div`
    margin-bottom: 10px;
    color: #0068BB;
`;

const RegisterLink = styled.div`
  font-weight: normal;
  font-size: 16px;
`;

const Button = styled.div`
  opacity: ${props => props.validating ? 0.6 : 1};
  cursor: ${props => props.validating ? 'default' : 'pointer'};
`;

export default {
    Container,
    SubContainer,
    Error,
    Message,
    RegisterLink,
    Button,
};